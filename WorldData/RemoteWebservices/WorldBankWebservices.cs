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
    /*
     * This class enables controllers connect to WorldBank's RESTFUL API webservices
     */

    public class WorldBankWebservices
    {
        /*
         * WorldBank's APIs tutorial: https://datahelpdesk.worldbank.org/knowledgebase/articles/898581-api-basic-call-structure
         */
        public static string WORLDBANK_ROOT = ConfigurationManager.AppSettings["WorldBankEndPoint"];
        public static string GDP_BY_YEAR = "countries/all/indicators/NY.GDP.PCAP.CD?format=json&page=1&per_page=265&date=";
        public static string GDP_BY_COUNTRY = "countries/###/indicators/NY.GDP.PCAP.CD?format=json&page=1&per_page=20000";
        public static string SUCCESS = "success";
        public static string ERROR = "error";

        //Call get method
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
                    return JObject.Parse(WorldBankWebservices.getJsonResultString(WorldBankWebservices.SUCCESS, data, ""));
                }
                else
                    return JObject.Parse(WorldBankWebservices.getJsonResultString(WorldBankWebservices.ERROR, "", response.ToString()));
            }
            catch (Exception e)
            {
                return JObject.Parse(WorldBankWebservices.getJsonResultString(WorldBankWebservices.ERROR, "", e.Message));
            }
        }

        //Call post method
        public static JObject postResource(string endpoint, string jsonString)
        {
            try
            {
                var jsonData = new StringContent(jsonString, Encoding.UTF8, "application/json");
                var client = new HttpClient();
                client.BaseAddress = new Uri(WORLDBANK_ROOT);
                client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
                HttpResponseMessage response = client.PostAsync(endpoint, jsonData).Result;
                if (response.IsSuccessStatusCode)
                {
                    var data = response.Content.ReadAsStringAsync().Result;
                    Object rs = JsonConvert.DeserializeObject(data);
                    return JObject.Parse(WorldBankWebservices.getJsonResultString(WorldBankWebservices.SUCCESS, rs,""));
                }
                else
                    return JObject.Parse(WorldBankWebservices.getJsonResultString(WorldBankWebservices.ERROR, "", response.ToString()));
            }
            catch (Exception e)
            {
                return JObject.Parse(WorldBankWebservices.getJsonResultString(WorldBankWebservices.ERROR, "", e.Message));
            }
        }

        //Form consitent format for responses
        public static string getJsonResultString(string status, Object data, string message)
        {
            var keyValues = new Dictionary<string, Object>
            {
                { "status", status.ToString()},
                { "data", data},
                { "message", message},                   
            };
            var serializer = new System.Web.Script.Serialization.JavaScriptSerializer();
            serializer.MaxJsonLength = Int32.MaxValue;
            string ret = serializer.Serialize(keyValues);
            return ret;
        }
    }   
}