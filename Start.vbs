Option Explicit
Dim fso, shell, folder, nodePath, entry, candidate, command
Set fso = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")
folder = fso.GetParentFolderName(WScript.ScriptFullName)
nodePath = folder & "\runtime\node.exe"
If Not fso.FileExists(nodePath) Then
  nodePath = ""
  For Each entry In Split(shell.ExpandEnvironmentStrings("%PATH%"), ";")
    entry = Replace(Trim(entry), """", "")
    If Len(entry) > 0 Then
      candidate = fso.BuildPath(entry, "node.exe")
      If fso.FileExists(candidate) Then
        nodePath = candidate
        Exit For
      End If
    End If
  Next
End If
If Len(nodePath) = 0 Then
  MsgBox "Node.js was not found. Install Node.js 24 LTS from https://nodejs.org/ and try again.", 48, "Gift Studio"
  WScript.Quit 1
End If
command = """" & nodePath & """ """ & folder & "\server.cjs"" --open"
shell.Run command, 0, False