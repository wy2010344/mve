using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Text;
using System.Windows.Forms;
using System.IO;
using System.Runtime.InteropServices;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
namespace S_Reader
{
    public partial class FormMain : Form
    {
        public FormMain(string[] args)
        {
            InitializeComponent();
            new BrowserView(this, args);
        }
    }
}