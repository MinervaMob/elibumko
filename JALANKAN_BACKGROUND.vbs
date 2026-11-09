' =====================================================================
' ElibUMKO - Runner Latar Belakang (Silent Mode)
' Menjalankan server tanpa menampilkan jendela CMD hitam
' =====================================================================

Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Dapatkan direktori skrip ini
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)

' Jalankan JALANKAN_ELIBUMKO.bat secara tersembunyi (window style 0 = hidden)
WshShell.CurrentDirectory = scriptDir
WshShell.Run "cmd /c JALANKAN_ELIBUMKO.bat", 0, False
