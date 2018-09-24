using System;
using System.Collections.Generic;
using System.Text;
using System.Windows.Forms;
using System.IO;
using System.Runtime.InteropServices;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace S_Reader
{
    [ComVisible(true)]
    public class BrowserView
    {
        JObject config;
        WebBrowser browserMain;
        FormMain form;
        public BrowserView(FormMain form, String[] args)
        {
            /*
            string config_text = readTxt(Program.current_path("config.json"));
            config = JObject.Parse(config_text);
             */
            this.form = form;
            this.browserMain = new WebBrowser();
            form.Controls.Add(this.browserMain);
            browserMain.Dock = DockStyle.Fill;
            browserMain.DocumentTitleChanged += new EventHandler(browserMain_DocumentTitleChanged);

            config = new JObject();
            String mve_path = Program.current_path("../../../../");
            config.Add("topUrl", mve_path + "/public/");
            config.Add("baseUrl", mve_path + "/public/index/");
            this.browserMain.ObjectForScripting = this;

            String act = "";
            String path = "";
            if (args.Length > 0)
            {
                String file = args[0];
                if (file.EndsWith("s-html"))
                {
                    act = "s-html";
                }
                else if (file.EndsWith("s-view"))
                {
                    act = "s-view";
                }
                else if (file.EndsWith("s-shell"))
                {
                    act = "s-shell";
                }
                path = "path=" + file;
            }
            this.browserMain.DocumentTitleChanged += new EventHandler(browserMain_DocumentTitleChanged);
            this.browserMain.Url = new Uri("file:///" + mve_path + "/public/index.html?act=" + act + "&" + path);
        }

        void browserMain_DocumentTitleChanged(object sender, EventArgs e)
        {

            this.form.Text = this.browserMain.Document.Title;
        }

        /*外部判断标识*/
        public bool csharp = true;
        public string _ini_(string method, string args)
        {
            JObject r = null;
            if ("config" == method)
            {
                r = success(config);
            }
            else if ("readTxt" == method)
            {
                JObject o = JObject.Parse(args);
                r = success(readTxt(o["path"].ToString()));
            }
            else
            {
                r = error("未找到定义");
            }
            string s = r.ToString();
            return s;
        }
        public string readTxt(string path)
        {
            StreamReader sr = new StreamReader(path, Encoding.UTF8);
            StringBuilder sb = new StringBuilder();
            string line;
            while ((line = sr.ReadLine()) != null)
            {
                sb.Append(line).Append("\n");
            }
            sr.Close();
            return sb.ToString();
        }
        public JObject success(JToken data)
        {
            JObject r = new JObject();
            r.Add("code", new JValue(0));
            r.Add("description", "成功");
            r.Add("data", data);
            return r;
        }
        public JObject error(string msg)
        {
            return error(-1, msg);
        }
        public JObject error(int code, string msg)
        {
            JObject r = new JObject();
            r.Add("code", new JValue(code));
            r.Add("description", new JValue(msg));
            return r;
        }
    }
}
