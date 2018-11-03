using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Web;
using System.Diagnostics;

namespace WorldData.RemoteWebservices
{
    public class WorldBankWebservices
    {
        //https://datahelpdesk.worldbank.org/knowledgebase/articles/898581-api-basic-call-structure
        public static string WORLDBANK_ROOT = ConfigurationManager.AppSettings["WorldBankEndPoint"];
        public static string API_SAMPLE_LIST = "sampleListFile";
        public static string API_SAMPLE_COLLECT = "collectSamples";
        public static string API_SAMPLE_COLLECT_STATUS = "bamCollectionStatus";
        public static string API_SAMPLE_UPLOAD = "uploadBamToNCBI";
        public static string API_SAMPLE_UPLOAD_STATUS = "uploadBamToNCBIStatus";
        public static string API_REFERENCE = "reference/"; 
        public static JObject getResource(string endpoint)
        {
            try
            {
                var client = new HttpClient();
                client.BaseAddress = new Uri(WORLDBANK_ROOT);
                client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
                HttpResponseMessage response = client.GetAsync(endpoint).Result;
                if (response.IsSuccessStatusCode)
                {
                    var data = response.Content.ReadAsStringAsync().Result;
                    JObject rs = (JObject)JsonConvert.DeserializeObject(data);
                    return rs;
                }
                else
                    return JObject.Parse(WorldBankWebservices.getJsonResultString("1", response.ToString()));
            }
            catch (Exception e)
            {
                return JObject.Parse(WorldBankWebservices.getJsonResultString("1", e.Message));
            }
        }

        public static JObject postResource(string endpoint, string jsonString)
        {
            try
            {
                var jsonData = new StringContent(jsonString, Encoding.UTF8, "application/json");
                var client = new HttpClient();
                client.BaseAddress = new Uri(WORLDBANK_ROOT);
                client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
                client.Timeout = new TimeSpan(0, 45, 30);//0 hours, 45 minutes, 30 seconds
                HttpResponseMessage response = client.PostAsync(endpoint, jsonData).Result;
                if (response.IsSuccessStatusCode)
                {
                    var data = response.Content.ReadAsStringAsync().Result;
                    JObject rs = (JObject)JsonConvert.DeserializeObject(data);
                    return rs;
                }
                else
                    return JObject.Parse(WorldBankWebservices.getJsonResultString("1", response.ToString()));
            }
            catch (Exception e)
            {
                return JObject.Parse(WorldBankWebservices.getJsonResultString("1", e.Message));
            }
        } 
    }

    public static string getJsonResultString(string retCode, string value, string note = ""){
        var keyValues = new Dictionary<string, string>
        {
            { "status", retCode},
            { "data", value},
            { "note", note}                    
        };
        var serializer = new System.Web.Script.Serialization.JavaScriptSerializer();
        serializer.MaxJsonLength = Int32.MaxValue;
        string ret = serializer.Serialize(keyValues); 
        return ret;
    }
}