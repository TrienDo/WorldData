using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using WorldData.RemoteWebservices;
namespace WorldData.Controllers
{
    public class HomeController : Controller
    {
        public ActionResult Index()
        {
            return View();
        }

        public ActionResult Maps()
        {
            ViewBag.Message = "This maps presents the world's data.";
            return View();
        }

        [HttpPost]
        public JObject getGdpAllCountriesByYear(string year)
        {
            return WorldBankWebservices.getResource(WorldBankWebservices.GDP_BY_YEAR + year);
        }

        [HttpPost]
        public JObject getGdpForCountries(string countryList)
        {
            return WorldBankWebservices.getResource(WorldBankWebservices.GDP_BY_COUNTRY.Replace("###",countryList));
        }

        public ActionResult Contact()
        {
            ViewBag.Message = "Your contact page.";

            return View();
        }
    }
}