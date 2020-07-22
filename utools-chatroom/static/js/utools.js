
subject_name = ""

utools.onPluginEnter(({ code, type, payload }) => {
  utools.setSubInputValue('value')
  utools.subInputFocus()
  console.log(utools.setSubInput(({ text }) => {
    console.log("subject: "+text)
    subject_name = text
  }, '主题'))
})


document.onkeydown = function (e) {
  var keyCode = window.event ? e.keyCode : e.which
  if (keyCode == 13) {
    if (subject_name === '') {
      console.log("return place")
    }
      console.log("join room: "+subject_name)
  }
}
