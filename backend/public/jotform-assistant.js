(function () {
  var config = window.JF_Gemini_Config || window.JF_ChatGPT_Config || {}
  var API_URL = config.apiUrl || "https://SEU-SERVIDOR.com/api/polish"
  var TONE = config.tone || "professional"
  var FIELD_ID = config.fieldId || null

  var style = document.createElement("style")
  style.textContent = [
    ".jf-chatgpt-btn {",
    "  display: inline-flex; align-items: center; gap: 6px;",
    "  padding: 6px 14px; margin: 4px 0;",
    "  background: #10a37f; color: #fff; border: none; border-radius: 6px;",
    "  font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;",
    "  cursor: pointer; transition: background .2s, opacity .2s;",
    "  line-height: 1.4; white-space: nowrap;",
    "}",
    ".jf-chatgpt-btn:hover { background: #0e8c6b; }",
    ".jf-chatgpt-btn:disabled { opacity: .6; cursor: not-allowed; }",
    ".jf-chatgpt-btn svg { width: 16px; height: 16px; flex-shrink: 0; }",
    ".jf-chatgpt-btn--done { background: #4caf50; }",
    ".jf-chatgpt-btn--error { background: #e53935; }",
    ".jf-chatgpt-spinner { animation: jf-spin .8s linear infinite; }",
    "@keyframes jf-spin { 100% { transform: rotate(360deg); } }",
    ".jf-chatgpt-wrapper { display: flex; align-items: flex-start; gap: 8px; }",
    ".jf-chatgpt-wrapper textarea, .jf-chatgpt-wrapper input { flex: 1; }",
  ].join("")
  document.head.appendChild(style)

  function createButton() {
    var btn = document.createElement("button")
    btn.className = "jf-chatgpt-btn"
    btn.type = "button"
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg> Melhorar'
    btn.title = "Melhorar texto com IA"
    return btn
  }

  function setLoading(btn) {
    btn.disabled = true
    btn.innerHTML =
      '<svg class="jf-chatgpt-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" stroke-dasharray="31.4 31.4" stroke-linecap="round"/></svg> Revisando...'
  }

  function setDone(btn) {
    btn.className = "jf-chatgpt-btn jf-chatgpt-btn--done"
    btn.disabled = false
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg> Pronto!'
    setTimeout(function () { resetBtn(btn) }, 2500)
  }

  function setError(btn, msg) {
    btn.className = "jf-chatgpt-btn jf-chatgpt-btn--error"
    btn.disabled = false
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg> Erro'
    btn.title = msg || "Erro ao revisar. Tente novamente."
    setTimeout(function () { resetBtn(btn) }, 4000)
  }

  function resetBtn(btn) {
    btn.className = "jf-chatgpt-btn"
    btn.disabled = false
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg> Melhorar'
    btn.title = "Melhorar texto com IA"
  }

  function getFieldLabel(input) {
    var parent = input.closest("li, div, .form-line, .form-field")
    if (!parent) return ""
    var label =
      parent.querySelector("label") ||
      parent.querySelector(".form-label") ||
      parent.querySelector('[class*="label"]')
    return label ? label.textContent.trim() : ""
  }

  async function callAPI(text, context) {
    var res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text, tone: TONE, context: context }),
    })
    if (!res.ok) {
      var err = await res.json().catch(function () { return { error: "Erro " + res.status } })
      throw new Error(err.error || "Erro ao conectar com o servidor")
    }
    var data = await res.json()
    return data.polished
  }

  function injectFields() {
    var fields
    if (FIELD_ID) {
      var el = document.getElementById(FIELD_ID)
      if (!el) return
      fields = el.tagName === "TEXTAREA" || el.tagName === "INPUT"
        ? [el]
        : el.querySelectorAll("textarea, input:not([type='hidden']):not([type='submit']):not([type='button'])")
    } else {
      fields = document.querySelectorAll("textarea, input[type='text'], input[type='email'], input:not([type])")
    }

    fields.forEach(function (field) {
      if (field.closest(".jf-chatgpt-wrapper")) return
      if (field.readOnly || field.disabled) return

      var wrapper = document.createElement("div")
      wrapper.className = "jf-chatgpt-wrapper"
      field.parentNode.insertBefore(wrapper, field)
      wrapper.appendChild(field)

      var btn = createButton()
      wrapper.appendChild(btn)

      btn.addEventListener("click", async function () {
        var text = field.value
        if (!text || text.trim().length === 0) {
          setError(btn, "Campo vazio. Escreva algo primeiro.")
          return
        }
        if (text.length > 10000) {
          setError(btn, "Texto muito longo (máx 10.000 caracteres).")
          return
        }

        setLoading(btn)
        try {
          var context = getFieldLabel(field)
          var polished = await callAPI(text, context)
          field.value = polished
          field.dispatchEvent(new Event("input", { bubbles: true }))
          field.dispatchEvent(new Event("change", { bubbles: true }))
          setDone(btn)
        } catch (err) {
          setError(btn, err.message)
        }
      })
    })
  }

  function start() {
    injectFields()
    var observer = new MutationObserver(injectFields)
    observer.observe(document.body, { childList: true, subtree: true })
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start)
  } else {
    start()
  }
})()
