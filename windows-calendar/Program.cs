using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace DigitalCalendar;

internal static class Program
{
    [STAThread]
    private static void Main()
    {
        ApplicationConfiguration.Initialize();
        Application.Run(new CalendarForm());
    }
}

internal sealed class CalendarForm : Form
{
    private const string CalendarUrl = "https://fire-digital-calendar.mintcocoajasmine.chatgpt.site";
    private readonly WebView2 webView = new() { Dock = DockStyle.Fill };
    private readonly Panel loadingPanel = new() { Dock = DockStyle.Fill, BackColor = Color.FromArgb(9, 20, 36) };
    private readonly Label loadingLabel = new()
    {
        AutoSize = true,
        ForeColor = Color.White,
        Font = new Font("Yu Gothic UI", 18, FontStyle.Bold),
        Text = "デジタルカレンダーを読み込んでいます…"
    };
    private bool fullScreen;
    private FormBorderStyle previousBorder;
    private FormWindowState previousState;

    public CalendarForm()
    {
        Text = "デジタルカレンダー";
        Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath);
        MinimumSize = new Size(900, 560);
        StartPosition = FormStartPosition.CenterScreen;
        WindowState = FormWindowState.Maximized;
        KeyPreview = true;

        loadingPanel.Controls.Add(loadingLabel);
        Controls.Add(webView);
        Controls.Add(loadingPanel);
        loadingPanel.BringToFront();

        loadingPanel.Resize += (_, _) => CenterLoadingLabel();
        Shown += async (_, _) => await InitializeBrowserAsync();
        KeyDown += HandleKeyDown;
    }

    private void CenterLoadingLabel()
    {
        loadingLabel.Left = Math.Max(12, (loadingPanel.ClientSize.Width - loadingLabel.Width) / 2);
        loadingLabel.Top = Math.Max(12, (loadingPanel.ClientSize.Height - loadingLabel.Height) / 2);
    }

    private async Task InitializeBrowserAsync()
    {
        try
        {
            var dataFolder = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "DigitalCalendar", "WebView2");
            var environment = await CoreWebView2Environment.CreateAsync(userDataFolder: dataFolder);
            await webView.EnsureCoreWebView2Async(environment);

            webView.CoreWebView2.Settings.AreDefaultContextMenusEnabled = false;
            webView.CoreWebView2.Settings.AreDevToolsEnabled = false;
            webView.CoreWebView2.Settings.IsStatusBarEnabled = false;
            webView.CoreWebView2.Settings.IsZoomControlEnabled = true;
            webView.CoreWebView2.NewWindowRequested += (_, e) =>
            {
                e.Handled = true;
                webView.CoreWebView2.Navigate(e.Uri);
            };
            webView.NavigationCompleted += (_, e) =>
            {
                if (e.IsSuccess) loadingPanel.Visible = false;
                else
                {
                    loadingLabel.Text = "読み込めませんでした。インターネット接続を確認してください。\nF5キーで再読み込みできます。";
                    loadingPanel.Visible = true;
                    CenterLoadingLabel();
                }
            };
            webView.Source = new Uri(CalendarUrl);
        }
        catch (Exception ex)
        {
            loadingLabel.Text = "起動できませんでした。Microsoft Edgeを更新してください。\n\n" + ex.Message;
            CenterLoadingLabel();
        }
    }

    private void HandleKeyDown(object? sender, KeyEventArgs e)
    {
        if (e.KeyCode == Keys.F11)
        {
            ToggleFullScreen();
            e.Handled = true;
        }
        else if (e.KeyCode == Keys.Escape && fullScreen)
        {
            ToggleFullScreen();
            e.Handled = true;
        }
        else if (e.KeyCode == Keys.F5 && webView.CoreWebView2 is not null)
        {
            loadingPanel.Visible = true;
            loadingPanel.BringToFront();
            webView.Reload();
            e.Handled = true;
        }
    }

    private void ToggleFullScreen()
    {
        if (!fullScreen)
        {
            previousBorder = FormBorderStyle;
            previousState = WindowState;
            FormBorderStyle = FormBorderStyle.None;
            WindowState = FormWindowState.Normal;
            Bounds = Screen.FromControl(this).Bounds;
            TopMost = true;
            fullScreen = true;
        }
        else
        {
            TopMost = false;
            FormBorderStyle = previousBorder;
            WindowState = previousState;
            fullScreen = false;
        }
    }
}
