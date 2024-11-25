/**
 * Window onerror
 * @param {ErrorEvent} event
 */
function window_onerror (event) {
  /**
   * 
   * @param {string} str 
   * @returns {string}
   */
  const sn = (str) => {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#x27;",
      "/": "&#x2F;",
    };
    const reg = /[&<>"'/]/gi;
    if (str === undefined || str === null) return "null";
    if (typeof str === "string") return str.replace(reg, (match) => map[match]);
    else return str.toString().replace(reg, (match) => map[match]);
  };
  const _TEMPLATE = `<div class="toast-container position-fixed bottom-0 end-0 p-3">
  <div id="error-toast" class="toast" role="alert" aria-live="assertive" aria-atomic="true" data-bs-autohide="false">
    <div class="toast-header">
      <span class="text-danger me-2"><i class="bi bi-x-circle"></i></span>
      <strong class="me-auto">SYSTEM</strong>
      <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
    <div class="toast-body">
      <p>${sn(event.error)}: ${sn(event.message)}</p>
      <p>${sn(event.filename)} @ ${sn(event.lineno)}:${sn(event.colno)}</p>
    </div>
  </div>
</div>
`;
  document.querySelector("#error").innerHTML = _TEMPLATE;

  const toastTrigger = document.getElementById("error-toast");

  if (toastTrigger) {
    bootstrap.Toast.getOrCreateInstance(toastTrigger).show();
  }
}

window.addEventListener('error', window_onerror)
window.onerror = (msg, source, lineno, colno, error) => {
    return window_onerror(new ErrorEvent(error.name, {
        message: msg,
        source: source,
        lineno: lineno,
        colno: colno,
        error: error
    }))
}

window.addEventListener('unhandledrejection', (event) => {
  // console.error(`Unhandled rejection: ${event.reason}`)
  window_onerror({error: "Promise rejection", message: event.reason, filename: 'SOMEWHERE', lineno: 0, colno: 0})
})