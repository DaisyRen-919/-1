(function () {
  "use strict";

  var rootPrefix = document.body.dataset.level === "pages" ? "../" : "";
  var storageKeys = {
    theme: "bjschool_theme",
    session: "bjschool_session",
    messages: "bjschool_messages",
    records: "bjschool_records",
    rights: "bjschool_rights"
  };
  var roleInfo = {
    parent: { label: "家长", page: "pages/parent.html" },
    teacher: { label: "教师", page: "pages/teacher.html" },
    school: { label: "学校管理人员", page: "pages/school.html" },
    admin: { label: "教育行政人员", page: "pages/admin.html" }
  };

  var featureIndex = [
    { title: "教师沟通", desc: "家长与教师实名沟通，原始内容留痕", page: "pages/parent.html#communication", role: "家长端" },
    { title: "提交反馈", desc: "选择类型、上传材料并阅读规则提示", page: "pages/parent.html#feedback", role: "家长端" },
    { title: "记录查询", desc: "查询受理状态、承办人和完整时间线", page: "pages/parent.html#records", role: "家长端" },
    { title: "沟通留痕", desc: "按班级和学生筛选记录并打印归档", page: "pages/teacher.html#messages", role: "教师端" },
    { title: "教师权益反馈", desc: "提交权益事项、补充材料、查看处理状态", page: "pages/teacher.html#rights", role: "教师端" },
    { title: "证据包", desc: "自动汇总沟通、反馈及处置节点用于打印", page: "pages/teacher.html#evidence", role: "教师端" },
    { title: "法律与心理支持", desc: "法律咨询和心理支持转介入口", page: "pages/teacher.html#support", role: "教师端" },
    { title: "处置工作台", desc: "学校分级受理、明确承办人和办理时限", page: "pages/school.html#workbench", role: "学校管理端" },
    { title: "投诉档案", desc: "统一编号、条件筛选与CSV台账导出", page: "pages/school.html#archive", role: "学校管理端" },
    { title: "校内公告", desc: "发布班级与学校范围的沟通提醒", page: "pages/school.html#notices", role: "学校管理端" },
    { title: "区级数据看板", desc: "查看区域事项分布、办理时效与复核情况", page: "pages/admin.html#dashboard", role: "教育行政端" },
    { title: "风险预警", desc: "发现短期重复、跨教师集中等异常线索", page: "pages/admin.html#warnings", role: "教育行政端" },
    { title: "内部信用记录", desc: "对经程序确认的记录实行分级、限权查看", page: "pages/admin.html#credit", role: "教育行政端" }
  ];

  var sampleMessages = [
    { id: "MSG-260908-01", person: "李老师", role: "班主任", time: "2026-09-08 09:18", text: "您好，孩子今天课堂状态已经好转。关于作业记录，我会在放学前再核对一次。", mine: false },
    { id: "MSG-260908-02", person: "学生家长", role: "家长", time: "2026-09-08 09:24", text: "收到，谢谢老师。我的主要疑问是昨天的作业登记是否遗漏，辛苦您核实。", mine: true }
  ];

  var sampleRecords = [
    { id: "JX-2026-0908-016", title: "关于课后作业登记的情况反馈", category: "教育教学", status: "沟通处理中", level: "一般", created: "2026-09-08 09:31", handler: "年级组 · 王老师", deadline: "2026-09-10", description: "希望核实作业登记是否存在遗漏，并完善班级通知方式。" },
    { id: "JX-2026-0905-009", title: "校园活动通知时间建议", category: "学校管理", status: "已办结", level: "一般", created: "2026-09-05 14:08", handler: "德育处 · 周老师", deadline: "2026-09-07", description: "建议重要活动至少提前三天通过统一渠道通知家长。" },
    { id: "JX-2026-0903-004", title: "午休环境情况咨询", category: "学生生活", status: "结果反馈", level: "一般", created: "2026-09-03 11:22", handler: "总务处 · 陈老师", deadline: "2026-09-06", description: "咨询午休区域噪声管理和轮值安排。" }
  ];

  function readJSON(key, fallback) {
    try {
      var value = JSON.parse(localStorage.getItem(key));
      return Array.isArray(value) ? value : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function readSession() {
    try {
      var value = JSON.parse(localStorage.getItem(storageKeys.session));
      return value && roleInfo[value.role] && value.name ? value : null;
    } catch (_) {
      return null;
    }
  }

  function writeJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function escapeHTML(value) {
    return String(value || "").replace(/[&<>'"]/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char];
    });
  }

  function nowText() {
    return new Intl.DateTimeFormat("zh-CN", {
      year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false
    }).format(new Date()).split("/").join("-");
  }

  var toastTimer;
  function toast(message) {
    var el = document.querySelector("[data-toast]");
    if (!el) return;
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove("show"); }, 3200);
  }

  function openDialog(target) {
    var dialog = typeof target === "string" ? document.querySelector(target) : target;
    if (!dialog) return false;
    if (typeof dialog.showModal === "function") {
      try {
        dialog.showModal();
      } catch (_) {
        dialog.setAttribute("open", "");
      }
    } else {
      dialog.setAttribute("open", "");
      dialog.classList.add("modal-fallback");
    }
    document.body.classList.add("modal-locked");
    return true;
  }

  function closeDialog(dialog) {
    if (!dialog) return;
    if (typeof dialog.close === "function" && dialog.hasAttribute("open")) {
      try { dialog.close(); } catch (_) { dialog.removeAttribute("open"); }
    } else {
      dialog.removeAttribute("open");
    }
    dialog.classList.remove("modal-fallback");
    if (!document.querySelector("dialog[open]")) document.body.classList.remove("modal-locked");
  }

  var actionCallback = null;
  function actionDialog() {
    var dialog = document.querySelector("[data-action-dialog]");
    if (dialog) return dialog;
    dialog = document.createElement("dialog");
    dialog.className = "modal";
    dialog.setAttribute("data-action-dialog", "");
    dialog.innerHTML = '<form class="modal-card" data-action-form>' +
      '<div class="modal-head"><div><p class="eyebrow">平台操作</p><h2 data-action-title>操作提示</h2></div><button class="icon-button" type="button" data-action-cancel aria-label="关闭">×</button></div>' +
      '<div data-action-body></div><div class="modal-actions"><button class="button secondary" type="button" data-action-cancel>取消</button><button class="button primary" type="submit" data-action-confirm>确认</button></div></form>';
    document.body.appendChild(dialog);
    dialog.querySelector("[data-action-form]").addEventListener("submit", function (event) {
      event.preventDefault();
      var callback = actionCallback;
      var values = new FormData(event.currentTarget);
      actionCallback = null;
      closeDialog(dialog);
      if (callback) callback(values);
    });
    dialog.addEventListener("click", function (event) {
      if (event.target === dialog || event.target.closest("[data-action-cancel]")) {
        actionCallback = null;
        closeDialog(dialog);
      }
    });
    return dialog;
  }

  function showAction(options) {
    var dialog = actionDialog();
    var body = dialog.querySelector("[data-action-body]");
    dialog.querySelector("[data-action-title]").textContent = options.title || "操作提示";
    dialog.querySelector("[data-action-confirm]").textContent = options.confirmText || "确认";
    var html = options.message ? '<p class="action-message">' + escapeHTML(options.message) + "</p>" : "";
    (options.fields || []).forEach(function (field) {
      var required = field.required ? " required" : "";
      html += '<label class="field action-field"><span>' + escapeHTML(field.label) + "</span>";
      if (field.type === "select") {
        html += '<select name="' + escapeHTML(field.name) + '"' + required + ">" + field.options.map(function (option) {
          return "<option>" + escapeHTML(option) + "</option>";
        }).join("") + "</select>";
      } else if (field.type === "textarea") {
        html += '<textarea name="' + escapeHTML(field.name) + '" placeholder="' + escapeHTML(field.placeholder || "") + '"' + required + "></textarea>";
      } else {
        html += '<input name="' + escapeHTML(field.name) + '" placeholder="' + escapeHTML(field.placeholder || "") + '"' + required + ">";
      }
      html += "</label>";
    });
    body.innerHTML = html;
    actionCallback = options.onConfirm || null;
    openDialog(dialog);
    var first = body.querySelector("input, textarea, select");
    if (first) setTimeout(function () { first.focus(); }, 50);
  }

  function initLogin() {
    var form = document.querySelector("[data-login-form]");
    if (!form) return;
    var selectedRole = "";
    var error = document.querySelector("[data-login-error]");
    var previous = readSession();
    var requested = new URLSearchParams(location.search).get("next");
    if (previous) form.elements.displayName.value = previous.name;

    function selectRole(role) {
      if (!roleInfo[role]) return;
      selectedRole = role;
      document.querySelectorAll("[data-role-choice]").forEach(function (button) {
        var active = button.dataset.roleChoice === role;
        button.classList.toggle("selected", active);
        button.setAttribute("aria-pressed", active ? "true" : "false");
        var indicator = button.querySelector("i");
        if (indicator) indicator.textContent = active ? "已选择" : "选择";
      });
      if (error) error.textContent = "";
    }

    document.querySelectorAll("[data-role-choice]").forEach(function (button) {
      button.addEventListener("click", function () { selectRole(button.dataset.roleChoice); });
    });
    if (roleInfo[requested]) selectRole(requested);
    else if (previous) selectRole(previous.role);

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var name = String(form.elements.displayName.value || "").trim();
      if (!name) {
        error.textContent = "请先填写称呼。";
        form.elements.displayName.focus();
        return;
      }
      if (!selectedRole) {
        error.textContent = "请先选择一个身份。";
        return;
      }
      localStorage.setItem(storageKeys.session, JSON.stringify({ name: name, role: selectedRole, loginAt: Date.now() }));
      location.href = roleInfo[selectedRole].page;
    });
  }

  function initAuth() {
    var requiredRole = document.body.dataset.authRole;
    if (!requiredRole) return true;
    var session = readSession();
    if (!session || session.role !== requiredRole) {
      location.replace(rootPrefix + "index.html?next=" + encodeURIComponent(requiredRole));
      return false;
    }
    document.querySelectorAll("[data-user-name]").forEach(function (el) { el.textContent = session.name; });
    document.querySelectorAll("[data-user-role]").forEach(function (el) { el.textContent = roleInfo[requiredRole].label; });
    document.querySelectorAll("[data-logout]").forEach(function (button) {
      button.addEventListener("click", function () {
        localStorage.removeItem(storageKeys.session);
        location.href = rootPrefix + "index.html?next=" + encodeURIComponent(requiredRole);
      });
    });
    return true;
  }

  function initTheme() {
    var saved = localStorage.getItem(storageKeys.theme);
    if (saved === "dark") document.body.classList.add("dark");
    document.querySelectorAll("[data-theme-toggle]").forEach(function (button) {
      button.textContent = document.body.classList.contains("dark") ? "浅色模式" : "深色模式";
      button.addEventListener("click", function () {
        document.body.classList.toggle("dark");
        var isDark = document.body.classList.contains("dark");
        localStorage.setItem(storageKeys.theme, isDark ? "dark" : "light");
        button.textContent = isDark ? "浅色模式" : "深色模式";
      });
    });
  }

  function initSearch() {
    var dialog = document.querySelector("[data-search-dialog]");
    var input = document.querySelector("[data-search-input]");
    var results = document.querySelector("[data-search-results]");
    if (!dialog || !input || !results) return;

    function render(query) {
      var term = query.trim().toLowerCase();
      var items = featureIndex.filter(function (item) {
        return !term || (item.title + item.desc + item.role).toLowerCase().indexOf(term) !== -1;
      });
      results.innerHTML = items.length ? items.slice(0, 8).map(function (item) {
        return '<a class="search-result" href="' + rootPrefix + item.page + '"><strong>' + escapeHTML(item.title) + "</strong><small>" + escapeHTML(item.role + " · " + item.desc) + "</small></a>";
      }).join("") : '<div class="empty-state">没有找到相关功能，请换一个关键词。</div>';
    }

    document.querySelectorAll("[data-search-open]").forEach(function (button) {
      button.addEventListener("click", function () {
        openDialog(dialog);
        render("");
        setTimeout(function () { input.focus(); }, 50);
      });
    });
    input.addEventListener("input", function () { render(input.value); });
    render("");
  }

  function initCommon() {
    document.querySelectorAll("[data-process-open]").forEach(function (button) {
      button.addEventListener("click", function () { openDialog("[data-process-dialog]"); });
    });
    var backTop = document.querySelector("[data-back-top]");
    if (backTop) {
      window.addEventListener("scroll", function () { backTop.classList.toggle("show", window.scrollY > 500); }, { passive: true });
      backTop.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
    }
    document.querySelectorAll("[data-reset-demo]").forEach(function (button) {
      button.addEventListener("click", function () {
        [storageKeys.messages, storageKeys.records, storageKeys.rights].forEach(function (key) { localStorage.removeItem(key); });
        toast("演示记录已重置");
        setTimeout(function () { location.reload(); }, 650);
      });
    });
    document.querySelectorAll("[data-print]").forEach(function (button) {
      button.addEventListener("click", function () { window.print(); });
    });

    document.addEventListener("click", function (event) {
      var messageButton = event.target.closest("[data-toast-message]");
      if (messageButton) {
        showAction({ title: "操作已响应", message: messageButton.dataset.toastMessage, confirmText: "知道了", onConfirm: function () { toast(messageButton.dataset.toastMessage); } });
      }
      var cancelButton = event.target.closest("dialog [value='cancel']");
      if (cancelButton) closeDialog(cancelButton.closest("dialog"));
    });

    document.querySelectorAll(".modal").forEach(function (dialog) {
      dialog.addEventListener("click", function (event) {
        if (event.target === dialog) closeDialog(dialog);
      });
      dialog.addEventListener("close", function () {
        if (!document.querySelector("dialog[open]")) document.body.classList.remove("modal-locked");
      });
    });
  }

  function messages() { return readJSON(storageKeys.messages, sampleMessages.slice()); }
  function records() { return readJSON(storageKeys.records, sampleRecords.slice()); }

  function renderMessages() {
    var list = document.querySelector("[data-message-list]");
    if (!list) return;
    list.innerHTML = messages().map(function (message) {
      return '<div class="message ' + (message.mine ? "mine" : "") + '"><div><strong>' + escapeHTML(message.person) + "</strong><time>" + escapeHTML(message.time) + "</time></div><p>" + escapeHTML(message.text) + "</p></div>";
    }).join("");
  }

  function initMessageForm() {
    var form = document.querySelector("[data-message-form]");
    var input = document.querySelector("[data-message-input]");
    if (!form || !input) return;
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var text = input.value.trim();
      if (!text) return;
      var all = messages();
      var session = readSession();
      all.push({ id: "MSG-" + Date.now(), person: session ? session.name : "学生家长", role: "家长", time: nowText(), text: text, mine: true });
      writeJSON(storageKeys.messages, all);
      input.value = "";
      renderMessages();
      toast("沟通内容已留痕，原文不可改写");
    });
  }

  function initParentActions() {
    var switchButton = document.querySelector("[data-teacher-switch]");
    if (switchButton) {
      switchButton.addEventListener("click", function () {
        showAction({
          title: "切换沟通教师",
          message: "请选择需要沟通的教师。",
          confirmText: "确认切换",
          fields: [{ name: "teacher", label: "教师", type: "select", options: ["六年级（2）班 · 李老师", "六年级（2）班 · 张老师", "六年级（2）班 · 陈老师"], required: true }],
          onConfirm: function (values) {
            var teacher = String(values.get("teacher"));
            var title = document.querySelector("[data-current-teacher]");
            var detail = document.querySelector("[data-current-teacher-detail]");
            if (title) title.textContent = teacher;
            if (detail) detail.textContent = teacher.indexOf("李老师") !== -1 ? "班主任 / 语文教师 · 工作时段内回复" : "任课教师 · 工作时段内回复";
            toast("已切换至 " + teacher);
          }
        });
      });
    }
    var reviewButton = document.querySelector("[data-review-action]");
    if (reviewButton) {
      reviewButton.addEventListener("click", function () {
        closeDialog(reviewButton.closest("dialog"));
        showAction({
          title: "申请复核",
          message: "请补充对处理结果的异议和希望复核的事项。",
          confirmText: "提交复核申请",
          fields: [{ name: "reason", label: "复核理由", type: "textarea", placeholder: "请陈述事实、依据和具体诉求", required: true }],
          onConfirm: function () { toast("复核申请已提交，平台将保留本次补充说明"); }
        });
      });
    }
  }

  function statusTag(status) {
    var style = status.indexOf("办结") !== -1 ? "green" : status.indexOf("反馈") !== -1 ? "blue" : status.indexOf("复核") !== -1 ? "amber" : "red";
    return '<span class="tag ' + style + '">' + escapeHTML(status) + "</span>";
  }

  function recordTimeline(record) {
    return [
      { time: record.created.slice(5), title: "事项已提交", text: "生成统一编号 " + record.id + "，原始内容进入留痕库。" },
      { time: "当日", title: "学校已受理", text: "承办人：" + record.handler + "；办理时限：" + record.deadline + "。" },
      { time: "办理中", title: record.status, text: record.status === "已办结" ? "处置结果已经反馈，事项完成归档。" : "正在核验材料并与相关人员沟通，节点变化将同步更新。" }
    ];
  }

  function openRecord(record) {
    var dialog = document.querySelector("[data-record-dialog]");
    var body = document.querySelector("[data-record-detail]");
    if (!dialog || !body) return;
    body.innerHTML = '<div class="notice blue"><strong>' + escapeHTML(record.id) + "</strong> · " + escapeHTML(record.category) + " · " + escapeHTML(record.level) + "事项</div>" +
      '<h3 style="margin:18px 0 5px">' + escapeHTML(record.title) + '</h3><p style="color:var(--muted)">' + escapeHTML(record.description) + "</p>" +
      '<div class="timeline">' + recordTimeline(record).map(function (item) {
        return '<div class="timeline-item"><time>' + escapeHTML(item.time) + '</time><span class="timeline-dot"></span><div><strong>' + escapeHTML(item.title) + "</strong><p>" + escapeHTML(item.text) + "</p></div></div>";
      }).join("") + "</div>";
    openDialog(dialog);
  }

  function renderParentRecords() {
    var list = document.querySelector("[data-parent-records]");
    if (!list) return;
    var all = records();
    list.innerHTML = all.map(function (record, index) {
      return '<article class="record-item"><div><h4>' + escapeHTML(record.title) + '</h4><div class="record-meta"><span>' + escapeHTML(record.id) + "</span><span>" + escapeHTML(record.category) + "</span><span>提交：" + escapeHTML(record.created) + "</span><span>承办：" + escapeHTML(record.handler) + '</span></div></div><div class="record-actions">' + statusTag(record.status) + '<button class="link-button" type="button" data-record-index="' + index + '">查看详情</button></div></article>';
    }).join("");
    list.querySelectorAll("[data-record-index]").forEach(function (button) {
      button.addEventListener("click", function () { openRecord(all[Number(button.dataset.recordIndex)]); });
    });
  }

  function initFeedbackForm() {
    var form = document.querySelector("[data-feedback-form]");
    if (!form) return;
    var textArea = form.querySelector("[name=description]");
    var riskBox = form.querySelector("[data-risk-box]");
    var fileInput = form.querySelector("[type=file]");
    var fileList = form.querySelector("[data-file-list]");
    var risky = ["开除", "曝光", "弄死", "报复", "人肉", "滚蛋", "废物"];

    textArea.addEventListener("input", function () {
      var hits = risky.filter(function (word) { return textArea.value.indexOf(word) !== -1; });
      riskBox.classList.toggle("show", hits.length > 0);
      riskBox.textContent = hits.length ? "表达提醒：检测到可能引发对立或人身攻击的词语（“" + hits.join("、") + "”）。请尽量陈述可核验事实与具体诉求。此提醒不会自动判定事项性质。" : "";
    });
    fileInput.addEventListener("change", function () {
      var names = Array.prototype.slice.call(fileInput.files || []).map(function (file) { return file.name; });
      fileList.textContent = names.length ? "已选择：" + names.join("、") : "未选择文件";
    });
    form.addEventListener("reset", function () {
      setTimeout(function () {
        fileList.textContent = "未选择文件";
        riskBox.textContent = "";
        riskBox.classList.remove("show");
      }, 0);
    });
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var data = new FormData(form);
      var stamp = String(Date.now()).slice(-6);
      var item = {
        id: "JX-2026-" + stamp,
        title: String(data.get("subject") || "家校事项反馈"),
        category: String(data.get("category") || "其他"),
        status: "待受理",
        level: "待分级",
        created: nowText(),
        handler: "待学校分派",
        deadline: "受理后生成",
        description: String(data.get("description") || "")
      };
      var all = records();
      all.unshift(item);
      writeJSON(storageKeys.records, all);
      form.reset();
      renderParentRecords();
      var recordsSection = document.querySelector("#records");
      if (recordsSection) recordsSection.scrollIntoView({ behavior: "smooth" });
      toast("提交成功，已生成编号 " + item.id);
    });
  }

  function initTeacherActions() {
    document.querySelectorAll("[data-teacher-filter]").forEach(function (chip) {
      chip.addEventListener("click", function () {
        document.querySelectorAll("[data-teacher-filter]").forEach(function (item) { item.classList.remove("active"); });
        chip.classList.add("active");
        var label = document.querySelector("[data-current-class]");
        if (label) label.textContent = chip.dataset.teacherFilter + " · 原始记录封存";
        var messageList = document.querySelector("[data-message-list]");
        if (chip.dataset.teacherFilter === "六年级（1）班" && messageList) {
          messageList.innerHTML = '<div class="empty-state">该班级当前没有需要展示的沟通记录。</div>';
        } else {
          renderMessages();
        }
        toast("已显示 " + chip.dataset.teacherFilter + " 的沟通记录");
      });
    });
    var explanation = document.querySelector("[data-add-explanation]");
    if (explanation) {
      explanation.addEventListener("click", function () {
        showAction({
          title: "追加教师说明",
          message: "说明将作为一条新的时间戳记录保存，不会覆盖原始沟通。",
          confirmText: "追加并留痕",
          fields: [{ name: "explanation", label: "补充说明", type: "textarea", placeholder: "请补充可核验的事实和相关情况", required: true }],
          onConfirm: function (values) {
            var all = messages();
            var session = readSession();
            all.push({ id: "MSG-" + Date.now(), person: session ? session.name : "教师", role: "教师", time: nowText(), text: String(values.get("explanation")), mine: false });
            writeJSON(storageKeys.messages, all);
            renderMessages();
            toast("教师说明已追加并留痕");
          }
        });
      });
    }
    var evidence = document.querySelector("[data-add-evidence]");
    if (evidence) {
      evidence.addEventListener("click", function () {
        evidence.textContent = "已加入证据包";
        evidence.disabled = true;
        toast("当前沟通记录已加入证据包");
      });
    }
  }

  function initRightsForm() {
    var form = document.querySelector("[data-rights-form]");
    var list = document.querySelector("[data-rights-list]");
    if (!form || !list) return;
    function render() {
      var all = readJSON(storageKeys.rights, [
        { id: "QY-2026-018", title: "公开澄清申请", category: "名誉与专业评价", time: "2026-09-06 16:20", status: "校级复核" }
      ]);
      list.innerHTML = all.map(function (item) {
        return '<article class="record-item"><div><h4>' + escapeHTML(item.title) + '</h4><div class="record-meta"><span>' + escapeHTML(item.id) + "</span><span>" + escapeHTML(item.category) + "</span><span>" + escapeHTML(item.time) + '</span></div></div><div class="record-actions">' + statusTag(item.status) + '<button class="link-button" type="button" data-toast-message="材料补充入口已打开。演示版不会上传真实文件。">补充材料</button></div></article>';
      }).join("");
    }
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var data = new FormData(form);
      var all = readJSON(storageKeys.rights, []);
      all.unshift({ id: "QY-2026-" + String(Date.now()).slice(-4), title: String(data.get("title")), category: String(data.get("category")), time: nowText(), status: "待受理" });
      writeJSON(storageKeys.rights, all);
      form.reset();
      render();
      toast("教师权益反馈已提交并留痕");
    });
    render();
  }

  function renderSchoolTable(filter) {
    var body = document.querySelector("[data-school-table]");
    if (!body) return;
    var all = records().filter(function (record) { return !filter || filter === "全部" || record.status.indexOf(filter) !== -1; });
    body.innerHTML = all.map(function (record) {
      return '<tr><td><strong>' + escapeHTML(record.id) + "</strong></td><td>" + escapeHTML(record.category) + "</td><td>" + escapeHTML(record.title) + "</td><td>" + escapeHTML(record.level) + "</td><td>" + statusTag(record.status) + "</td><td>" + escapeHTML(record.handler) + "</td><td>" + escapeHTML(record.deadline) + '</td><td><button class="link-button" type="button" data-school-item="' + escapeHTML(record.id) + '">办理</button></td></tr>';
    }).join("") || '<tr><td colspan="8"><div class="empty-state">暂无符合条件的记录</div></td></tr>';
    body.querySelectorAll("[data-school-item]").forEach(function (button) {
      button.addEventListener("click", function () {
        var id = button.dataset.schoolItem;
        var record = records().filter(function (item) { return item.id === id; })[0];
        if (!record) return;
        showAction({
          title: "办理事项 " + record.id,
          message: record.title,
          confirmText: "保存办理节点",
          fields: [
            { name: "status", label: "更新状态", type: "select", options: ["调查处理中", "结果反馈", "已办结"], required: true },
            { name: "handler", label: "承办人", type: "input", placeholder: record.handler, required: true }
          ],
          onConfirm: function (values) {
            var allRecords = records();
            allRecords.forEach(function (item) {
              if (item.id === id) {
                item.status = String(values.get("status"));
                item.handler = String(values.get("handler"));
              }
            });
            writeJSON(storageKeys.records, allRecords);
            renderSchoolTable("全部");
            document.querySelectorAll("[data-filter]").forEach(function (item) { item.classList.toggle("active", item.dataset.filter === "全部"); });
            toast("办理节点已更新并留痕");
          }
        });
      });
    });
  }

  function csvEscape(value) { return '"' + String(value).split('"').join('""') + '"'; }
  function downloadText(filename, text, type) {
    var url = URL.createObjectURL(new Blob([text], { type: type || "text/plain;charset=utf-8" }));
    var link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function exportCSV() {
    var header = ["事项编号", "类型", "标题", "分级", "状态", "承办人", "办理时限"];
    var rows = records().map(function (item) { return [item.id, item.category, item.title, item.level, item.status, item.handler, item.deadline]; });
    var csv = "\ufeff" + [header].concat(rows).map(function (row) { return row.map(csvEscape).join(","); }).join("\n");
    downloadText("家校反馈处置台账.csv", csv, "text/csv;charset=utf-8");
    toast("台账已导出为 CSV 文件");
  }

  function initSchool() {
    if (!document.querySelector("[data-school-table]")) return;
    renderSchoolTable("全部");
    document.querySelectorAll("[data-filter]").forEach(function (chip) {
      chip.addEventListener("click", function () {
        document.querySelectorAll("[data-filter]").forEach(function (item) { item.classList.remove("active"); });
        chip.classList.add("active");
        renderSchoolTable(chip.dataset.filter);
      });
    });
    var exportButton = document.querySelector("[data-export-csv]");
    if (exportButton) exportButton.addEventListener("click", exportCSV);

    var entryButton = document.querySelector("[data-open-entry]");
    if (entryButton) {
      entryButton.addEventListener("click", function () {
        showAction({
          title: "登记线下事项",
          message: "将电话、来访等线下反馈纳入统一编号和处置流程。",
          confirmText: "登记并生成编号",
          fields: [
            { name: "title", label: "事项标题", type: "input", placeholder: "简要概括线下反馈", required: true },
            { name: "category", label: "事项类型", type: "select", options: ["教育教学", "班级管理", "学生生活", "学校管理", "其他"], required: true },
            { name: "handler", label: "承办人", type: "input", placeholder: "例如：年级组 · 王老师", required: true }
          ],
          onConfirm: function (values) {
            var stamp = String(Date.now()).slice(-6);
            var all = records();
            all.unshift({ id: "JX-2026-" + stamp, title: String(values.get("title")), category: String(values.get("category")), status: "待受理", level: "待分级", created: nowText(), handler: String(values.get("handler")), deadline: "受理后生成", description: "由学校工作人员登记的线下反馈事项。" });
            writeJSON(storageKeys.records, all);
            renderSchoolTable("全部");
            toast("线下事项已登记并生成编号 JX-2026-" + stamp);
          }
        });
      });
    }

    var noticeButton = document.querySelector("[data-open-notice]");
    if (noticeButton) {
      noticeButton.addEventListener("click", function () {
        showAction({
          title: "新建校内公告",
          message: "公告将出现在本页演示列表中。",
          confirmText: "发布公告",
          fields: [
            { name: "title", label: "公告标题", type: "input", placeholder: "请输入公告标题", required: true },
            { name: "scope", label: "发布范围", type: "select", options: ["全校", "六年级", "指定班级"], required: true }
          ],
          onConfirm: function (values) {
            var list = document.querySelector("[data-notice-list]");
            var article = document.createElement("article");
            article.className = "record-item";
            article.innerHTML = '<div><h4>' + escapeHTML(values.get("title")) + '</h4><div class="record-meta"><span>发布范围：' + escapeHTML(values.get("scope")) + "</span><span>发布人：" + escapeHTML((readSession() || {}).name || "学校管理员") + "</span><span>" + escapeHTML(nowText()) + '</span></div></div><div class="record-actions"><span class="tag green">已发布</span><button class="link-button" type="button" data-toast-message="公告详情已打开（演示）">查看</button></div>';
            list.insertBefore(article, list.firstChild);
            toast("公告已发布到演示列表");
          }
        });
      });
    }
  }

  function initAdmin() {
    document.querySelectorAll("[data-risk-action]").forEach(function (button) {
      button.addEventListener("click", function () {
        button.textContent = "已转人工复核";
        button.disabled = true;
        toast("预警线索已转入人工复核队列");
      });
    });
    var summaryButton = document.querySelector("[data-export-summary]");
    if (summaryButton) {
      summaryButton.addEventListener("click", function () {
        var summary = "北京市家校沟通与投诉规范平台\n月度治理摘要（演示）\n\n本月受理：1,284\n按时办结率：94.6%\n沟通协商解决率：68.0%\n进入复核程序：37\n\n说明：本文件仅为机制演示数据，不对应真实人员或案件。\n";
        downloadText("月度治理摘要-演示.txt", summary, "text/plain;charset=utf-8");
        toast("月度治理摘要已下载");
      });
    }
    var coordinationButton = document.querySelector("[data-open-coordination]");
    if (coordinationButton) {
      coordinationButton.addEventListener("click", function () {
        showAction({
          title: "发起联席协调",
          message: "为复杂事项建立多方协同记录。",
          confirmText: "发起协调",
          fields: [
            { name: "title", label: "协调事项", type: "input", placeholder: "请输入事项名称", required: true },
            { name: "participants", label: "参与单位", type: "input", placeholder: "例如：学校、法律顾问、心理服务机构", required: true }
          ],
          onConfirm: function (values) {
            var list = document.querySelector("[data-coordination-list]");
            var article = document.createElement("article");
            article.className = "record-item";
            article.innerHTML = '<div><h4>LX-2026-' + String(Date.now()).slice(-3) + " · " + escapeHTML(values.get("title")) + '</h4><div class="record-meta"><span>牵头：区教育行政部门</span><span>参与：' + escapeHTML(values.get("participants")) + '</span><span>创建：' + escapeHTML(nowText()) + '</span></div></div><span class="tag blue">协调中</span>';
            list.insertBefore(article, list.firstChild);
            toast("联席协调事项已建立");
          }
        });
      });
    }
  }

  initTheme();
  initLogin();
  if (!initAuth()) return;
  initSearch();
  initCommon();
  renderMessages();
  initMessageForm();
  initParentActions();
  renderParentRecords();
  initFeedbackForm();
  initTeacherActions();
  initRightsForm();
  initSchool();
  initAdmin();
})();
