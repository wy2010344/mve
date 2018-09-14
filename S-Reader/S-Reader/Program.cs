using System;
using System.Collections.Generic;
using System.Windows.Forms;
using System.IO;

namespace S_Reader
{
    static class Program
    {
        static string _current_path =Directory.GetParent(System.Windows.Forms.Application.ExecutablePath).FullName.Replace('\\','/');//可执行文件路径
        //Environment.CurrentDirectory;//是文档路径，跟./一样
        public static string current_path(string name)
        {
            String[] nodes=_current_path.Split('/');
            String[] names = name.Split('/');
            List<String> list = new List<string>(nodes);
            for (int i = 0; i < names.Length; i++)
            {
                String n = names[i];
                if (n == ".")
                {
                }
                else if(n=="..")
                {
                    list.RemoveAt(list.Count - 1);
                }
                else if (n == "")
                {
                }
                else
                {
                    list.Add(n);
                }
            }
            return String.Join("/", list.ToArray());
            //return System.IO.Path.Combine(_current_path, name);
        }
        public static string current_path()
        {
            return _current_path;
        }
        public static void Log(string msg)
        {
            using (StreamWriter sw = new StreamWriter(current_path("log.txt"), true))
            {
                sw.Write("旧路径");
                sw.Write(current_path("log.txt"));
                sw.Write(new DateTime().ToString());
                sw.Write(msg);
                sw.WriteLine();
            }
        }
        /// <summary>
        /// 应用程序的主入口点。
        /// https://www.cnblogs.com/margin-gu/p/5789469.html
        /// </summary>
        [STAThread]
        static void Main(string[] args)
        {
            //Log("进入");
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new FormMain(args));
        }
    }
}