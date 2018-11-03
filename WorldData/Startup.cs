using Microsoft.Owin;
using Owin;

[assembly: OwinStartupAttribute(typeof(WorldData.Startup))]
namespace WorldData
{
    public partial class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            ConfigureAuth(app);
        }
    }
}
