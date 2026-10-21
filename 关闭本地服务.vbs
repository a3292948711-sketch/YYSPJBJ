Option Explicit
Dim request
On Error Resume Next
Set request = CreateObject("WinHttp.WinHttpRequest.5.1")
request.Open "POST", "http://127.0.0.1:17865/api/action", False
request.SetRequestHeader "Content-Type", "application/json"
request.Send "{""type"":""shutdown""}"
