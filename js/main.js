(function () {
  "use strict";

  const rootPrefix = document.body.dataset.level === "pages" ? "../" : "";
  const storageKeys = {
    theme: "bjschool_theme",
    messages: "bjschool_messages",
    records: "bjschool_records",
    rights: "bjschool_rights"
  };

  const featureIndex = [
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

  const sampleMessages = [
    { id: "MSG-260908-01", person: "李老师", role: "班主任", time: "2026-09-08 09:18", text: "您好，孩子今天课堂状态已经好转。关于作业记录，我会在放学前再核对一次。", mine: false },
    { id: "MSG-260908-02", person: "学生家长", role: "家长", time: "2026-09-08 09:24", text: "收到，谢谢老师。我的主要疑问是昨天的作业登记是否遗漏，辛苦您核实。", mine: true }
  ];

  const sampleRecords = [
    { id: "JX-2026-0908-016", title: "关于课后作业登记的情况反馈", category: "教育教学", status: "沟通处理中", level: "一般", created: "2026-09-08 09:31", handler: "年级组 · 王老师", deadline: "2026-09-10", description: "希望核实作业登记是否存在遗漏，并完善班级通知方式。" },
    { id: "JX-2026-0905-009", title: "校园活动通知时间建议", category: "学校管理", status: "已办结", level: "一般", created: "2026-09-05 14:08", handler: "德育处 · 周老师", deadline: "2026-09-07", description: "建议重要活动至少提前三天通过统一渠道通知家长。" },
    { id: "JX-2026-0903-004", title: "午休环境情况咨询", category: "学生生活", status: "结果反馈", level: "一般", created: "2026-09-03 11:22", handler: "总务处 · 陈老师", deadline: "2026-09-06", description: "咨询午休区域噪声管理和轮值安排。" }
  ];

  function readJSON(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return Array.isArray(value) ? value : fallback;
    } catch (_) { return fallback; }
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
    }).format(new Date()).replaceAll("/", "-");
  }

  let toastTimer;
  function toast(message) {
    const el = document.querySelector("[data-toast]");
    if (!el) return;
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove("show"); }, 2400);
  }

  function openDialog(selector) {
    const dialog = document.querySelector(selector);
    if (dialog && typeof dialog.showModal === "function") dialog.showModal();
  }

  function initTheme() {
    const saved = localStorage.getItem(storageKeys.theme);
    if (saved === "dark") document.body.classList.add("dark");
    document.querySelectorAll("[data-theme-toggle]").forEach(function (button) {
      button.textContent = document.body.classList.contains("dark") ? "浅色模式" : "深色模式";
      button.addEventListener("click", function () {
        document.body.classList.toggle("dark");
        const isDark = document.body.classList.contains("dark");
        localStorage.setItem(storageKeys.theme, isDark ? "dark" : "light");
        button.textContent = isDark ? "浅色模式" : "深色模式";
      });
    });
  }

  function initSearch() {
    const dialog = document.querySelector("[data-search-dialog]");
    const input = document.querySelector("[data-search-input]");
    const results = document.querySelector("[data-search-results]");
    if (!dialog || !input || !results) return;

    function render(query) {
      const term = query.trim().toLowerCase();
      const items = featureIndex.filter(function (item) {
        return !term || (item.title + item.desc + item.role).toLowerCase().includes(term);
      });
      results.innerHTML = items.length ? items.slice(0, 8).map(function (item) {
        return '<a class="search-result" href="' + rootPrefix + item.page + '"><strong>' + escapeHTML(item.title) + '</strong><small>' + escapeHTML(item.role + " · " + item.desc) + '</small></a>';
      }).join("") : '<div class="empty-state">没有找到相关功能，请换一个关键词。</div>';
    }

    document.querySelectorAll("[data-search-open]").forEach(function (button) {
      button.addEventListener("click", function () { dialog.showModal(); render(""); setTimeout(function () { input.focus(); }, 30); });
    });
    input.addEventListener("input", function () { render(input.value); });
    render("");
  }

  function initCommon() {
    document.querySelectorAll("[data-process-open]").forEach(function (button) {
      button.addEventListener("click", function () { openDialog("[data-process-dialog]"); });
    });
    const backTop = document.querySelector("[data-back-top]");
    if (backTop) {
      window.addEventListener("scroll", function () { backTop.classList.toggle("show", window.scrollY > 500); }, { passive: true });
      backTop.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
    }
    document.querySelectorAll("[data-reset-demo]").forEach(function (button) {
      button.addEventListener("click", function () {
        Object.values(storageKeys).forEach(function (key) { if (key !== storageKeys.theme) localStorage.removeItem(key); });
        toast("演示记录已重置");
        setTimeout(function () { location.reload(); }, 650);
      });
    });
    document.querySelectorAll("[data-print]").forEach(function (button) {
      button.addEventListener("click", function () { window.print(); });
    });
    document.querySelectorAll("[data-toast-message]").forEach(function (button) {
      button.addEventListener("click", function () { toast(button.dataset.toastMessage); });
    });
    document.querySelectorAll(".modal").forEach(function (dialog) {
      dialog.addEventListener("click", function (event) {
        if (event.target === dialog) dialog.close();
      });
    });
  }

  function messages() { return readJSON(storageKeys.messages, sampleMessages.slice()); }
  function records() { return readJSON(storageKeys.records, sampleRecords.slice()); }

  function renderMessages() {
    const list = document.querySelector("[data-message-list]");
    if (!list) return;
    list.innerHTML = messages().map(function (message) {
      return '<div class="message ' + (message.mine ? "mine" : "") + '"><div><strong>' + escapeHTML(message.person) + '</strong><time>' + escapeHTML(message.time) + '</time></div><p>' + escapeHTML(message.text) + '</p></div>';
    }).join("");
  }

  function initMessageForm() {
    const form = document.querySelector("[data-message-form]");
    const input = document.querySelector("[data-message-input]");
    if (!form || !input) return;
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      const all = messages();
      all.push({ id: "MSG-" + Date.now(), person: "学生家长", role: "家长", time: nowText(), text: text, mine: true });
      writeJSON(storageKeys.messages, all);
      input.value = "";
      renderMessages();
      toast("沟通内容已留痕，原文不可改写");
    });
  }

  function statusTag(status) {
    const style = status.includes("办结") ? "green" : status.includes("反馈") ? "blue" : status.includes("复核") ? "amber" : "red";
    return '<span class="tag ' + style + '">' + escapeHTML(status) + '</span>';
  }

  function recordTimeline(record) {
    return [
      { time: record.created.slice(5), title: "事项已提交", text: "生成统一编号 " + record.id + "，原始内容进入留痕库。" },
      { time: "当日", title: "学校已受理", text: "承办人：" + record.handler + "；办理时限：" + record.deadline + "。" },
      { time: "办理中", title: record.status, text: record.status === "已办结" ? "处置结果已经反馈，事项完成归档。" : "正在核验材料并与相关人员沟通，节点变化将同步更新。" }
    ];
  }

  function openRecord(record) {
    const dialog = document.querySelector("[data-record-dialog]");
    const body = document.querySelector("[data-record-detail]");
    if (!dialog || !body) return;
    body.innerHTML = '<div class="notice blue"><strong>' + escapeHTML(record.id) + '</strong> · ' + escapeHTML(record.category) + ' · ' + escapeHTML(record.level) + '事项</div>' +
      '<h3 style="margin:18px 0 5px">' + escapeHTML(record.title) + '</h3><p style="color:var(--muted)">' + escapeHTML(record.description) + '</p>' +
      '<div class="timeline">' + recordTimeline(record).map(function (item) {
        return '<div class="timeline-item"><time>' + escapeHTML(item.time) + '</time><span class="timeline-dot"></span><div><strong>' + escapeHTML(item.title) + '</strong><p>' + escapeHTML(item.text) + '</p></div></div>';
      }).join("") + '</div>';
    dialog.showModal();
  }

  function renderParentRecords() {
    const list = document.querySelector("[data-parent-records]");
    if (!list) return;
    const all = records();
    list.innerHTML = all.map(function (record, index) {
      return '<article class="record-item"><div><h4>' + escapeHTML(record.title) + '</h4><div class="record-meta"><span>' + escapeHTML(record.id) + '</span><span>' + escapeHTML(record.category) + '</span><span>提交：' + escapeHTML(record.created) + '</span><span>承办：' + escapeHTML(record.handler) + '</span></div></div><div class="record-actions">' + statusTag(record.status) + '<button class="link-button" type="button" data-record-index="' + index + '">查看详情</button></div></article>';
    }).join("");
    list.querySelectorAll("[data-record-index]").forEach(function (button) {
      button.addEventListener("click", function () { openRecord(all[Number(button.dataset.recordIndex)]); });
    });
  }

  function initFeedbackForm() {
    const form = document.querySelector("[data-feedback-form]");
    if (!form) return;
    const textArea = form.querySelector("[name=description]");
    const riskBox = form.querySelector("[data-risk-box]");
    const fileInput = form.querySelector("[type=file]");
    const fileList = form.querySelector("[data-file-list]");
    const risky = ["开除", "曝光", "弄死", "报复", "人肉", "滚蛋", "废物"];

    textArea.addEventListener("input", function () {
      const hits = risky.filter(function (word) { return textArea.value.includes(word); });
      riskBox.classList.toggle("show", hits.length > 0);
      riskBox.textContent = hits.length ? "表达提醒：检测到可能引发对立或人身攻击的词语（“" + hits.join("、") + "”）。请尽量陈述可核验事实与具体诉求。此提醒不会自动判定事项性质。" : "";
    });
    fileInput.addEventListener("change", function () {
      const names = Array.from(fileInput.files || []).map(function (file) { return file.name; });
      fileList.textContent = names.length ? "已选择：" + names.join("、") : "未选择文件";
    });
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      const data = new FormData(form);
      const stamp = String(Date.now()).slice(-6);
      const item = {
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
      const all = records();
      all.unshift(item);
      writeJSON(storageKeys.records, all);
      form.reset();
      fileList.textContent = "未选择文件";
      riskBox.classList.remove("show");
      renderParentRecords();
      document.querySelector("#records")?.scrollIntoView({ behavior: "smooth" });
      toast("提交成功，已生成编号 " + item.id);
    });
  }

  function initRightsForm() {
    const form = document.querySelector("[data-rights-form]");
    const list = document.querySelector("[data-rights-list]");
    if (!form || !list) return;
    function render() {
      const all = readJSON(storageKeys.rights, [
        { id: "QY-2026-018", title: "公开澄清申请", category: "名誉与专业评价", time: "2026-09-06 16:20", status: "校级复核" }
      ]);
      list.innerHTML = all.map(function (item) {
        return '<article class="record-item"><div><h4>' + escapeHTML(item.title) + '</h4><div class="record-meta"><span>' + escapeHTML(item.id) + '</span><span>' + escapeHTML(item.category) + '</span><span>' + escapeHTML(item.time) + '</span></div></div><div class="record-actions">' + statusTag(item.status) + '<button class="link-button" type="button" data-toast-message="材料补充入口已打开（离线演示）">补充材料</button></div></article>';
      }).join("");
      list.querySelectorAll("[data-toast-message]").forEach(function (button) { button.addEventListener("click", function () { toast(button.dataset.toastMessage); }); });
    }
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      const data = new FormData(form);
      const all = readJSON(storageKeys.rights, []);
      all.unshift({ id: "QY-2026-" + String(Date.now()).slice(-4), title: String(data.get("title")), category: String(data.get("category")), time: nowText(), status: "待受理" });
      writeJSON(storageKeys.rights, all);
      form.reset(); render(); toast("教师权益反馈已提交并留痕");
    });
    render();
  }

  function renderSchoolTable(filter) {
    const body = document.querySelector("[data-school-table]");
    if (!body) return;
    const all = records().filter(function (record) { return !filter || filter === "全部" || record.status.includes(filter); });
    body.innerHTML = all.map(function (record, index) {
      return '<tr><td><strong>' + escapeHTML(record.id) + '</strong></td><td>' + escapeHTML(record.category) + '</td><td>' + escapeHTML(record.title) + '</td><td>' + escapeHTML(record.level) + '</td><td>' + statusTag(record.status) + '</td><td>' + escapeHTML(record.handler) + '</td><td>' + escapeHTML(record.deadline) + '</td><td><button class="link-button" type="button" data-school-item="' + index + '">办理</button></td></tr>';
    }).join("") || '<tr><td colspan="8"><div class="empty-state">暂无符合条件的记录</div></td></tr>';
    body.querySelectorAll("[data-school-item]").forEach(function (button) {
      button.addEventListener("click", function () { toast("已进入事项办理视图（离线演示）"); });
    });
  }

  function csvEscape(value) { return '"' + String(value).replaceAll('"', '""') + '"'; }
  function exportCSV() {
    const header = ["事项编号", "类型", "标题", "分级", "状态", "承办人", "办理时限"];
    const rows = records().map(function (item) { return [item.id, item.category, item.title, item.level, item.status, item.handler, item.deadline]; });
    const csv = "\ufeff" + [header].concat(rows).map(function (row) { return row.map(csvEscape).join(","); }).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url; link.download = "家校反馈处置台账.csv"; link.click();
    URL.revokeObjectURL(url); toast("台账已导出为 CSV 文件");
  }

  function initSchool() {
    if (!document.querySelector("[data-school-table]")) return;
    renderSchoolTable("全部");
    document.querySelectorAll("[data-filter]").forEach(function (chip) {
      chip.addEventListener("click", function () {
        document.querySelectorAll("[data-filter]").forEach(function (item) { item.classList.remove("active"); });
        chip.classList.add("active"); renderSchoolTable(chip.dataset.filter);
      });
    });
    document.querySelector("[data-export-csv]")?.addEventListener("click", exportCSV);
  }

  function initAdmin() {
    document.querySelectorAll("[data-risk-action]").forEach(function (button) {
      button.addEventListener("click", function () {
        button.textContent = "已转人工复核"; button.disabled = true; toast("预警线索已转入人工复核队列");
      });
    });
  }

  initTheme();
  initSearch();
  initCommon();
  renderMessages();
  initMessageForm();
  renderParentRecords();
  initFeedbackForm();
  initRightsForm();
  initSchool();
  initAdmin();
})();
