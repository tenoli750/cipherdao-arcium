(function () {
  const core = window.GovernanceCore;
  const bank = window.BalanceDilemmas;

  const COPY = {
    en: {
      brandTitle: "Would You DAO?",
      connect: "Connect",
      working: "Working",
      hotTab: "Hot",
      newTab: "New",
      profileTab: "Profile",
      profileEyebrow: "Profile",
      profileTitle: "Private voting settings",
      profileBody: "Choose your language, connect your wallet, and launch custom sealed rounds.",
      walletLabel: "Wallet",
      connectWalletAction: "Connect wallet",
      languageLabel: "Language",
      liveRoundsLabel: "Live rounds",
      questionBankLabel: "Question bank",
      networkLabel: "Network",
      privacyEyebrow: "Sealed by Arcium",
      privacyBody: "Choices are encrypted in your browser. Live results stay hidden until the round closes and Arcium publishes the verified final tally.",
      createRoundAction: "Create custom round",
      customRoundTitle: "Custom round",
      categoryLabel: "Category",
      optionAEnLabel: "Option A in English",
      optionBEnLabel: "Option B in English",
      optionAKoLabel: "Option A in Korean",
      optionBKoLabel: "Option B in Korean",
      durationLabel: "Duration minutes",
      submitRoundAction: "Create sealed round",
      notConnected: "Not connected",
      questionEyebrow: "Would you rather...",
      sealed: "Sealed",
      open: "Open",
      final: "Final",
      ready: "Reveal",
      launch: "Launch round",
      voteA: "Vote A",
      voteB: "Vote B",
      skip: "Skip",
      reveal: "Reveal result",
      receipts: "receipts",
      noRounds: "No live rounds yet",
      noRoundsBody: "Open New and launch the first sealed balance game.",
      sealedTitle: "Live split sealed",
      sealedBody: "No one sees the result until Arcium finalizes the round.",
      finalResult: "Final result",
      optionAResult: "A",
      optionBResult: "B",
      skips: "Skips",
      walletConnected: "Wallet connected",
      installWallet: "Install Phantom or another Solana wallet",
      fillFields: "Fill the required round fields",
      preparingRound: "Preparing sealed round",
      approveRound: "Approve round in wallet",
      waitingInit: "Waiting for Arcium initialization",
      roundReady: "Round sealed on devnet",
      encrypting: "Encrypting choice in browser",
      preparingVote: "Preparing encrypted vote",
      approveVote: "Approve vote in wallet",
      waitingVote: "Waiting for Arcium finalization",
      voteFinalized: "Encrypted vote finalized",
      preparingReveal: "Preparing reveal",
      approveReveal: "Approve reveal in wallet",
      resultPublished: "Final result published",
      alreadyFinalized: "Final result already published",
      solanaDevnet: "Solana devnet",
      loading: "Loading",
      seconds: "s",
      minutes: "m",
      hours: "h",
      days: "d"
    },
    ko: {
      brandTitle: "씻었DAO",
      connect: "연결",
      working: "처리중",
      hotTab: "핫",
      newTab: "뉴",
      profileTab: "프로필",
      profileEyebrow: "프로필",
      profileTitle: "비공개 투표 설정",
      profileBody: "언어를 바꾸고, 지갑을 연결하고, 직접 봉인 라운드를 열 수 있어요.",
      walletLabel: "지갑",
      connectWalletAction: "지갑 연결",
      languageLabel: "언어",
      liveRoundsLabel: "진행 라운드",
      questionBankLabel: "질문 수",
      networkLabel: "네트워크",
      privacyEyebrow: "Arcium으로 봉인",
      privacyBody: "선택지는 브라우저에서 암호화됩니다. 실시간 결과는 숨겨지고, 마감 후 Arcium이 검증된 최종 결과만 공개합니다.",
      createRoundAction: "직접 라운드 만들기",
      customRoundTitle: "직접 만들기",
      categoryLabel: "카테고리",
      optionAEnLabel: "A 선택지 영어",
      optionBEnLabel: "B 선택지 영어",
      optionAKoLabel: "A 선택지 한국어",
      optionBKoLabel: "B 선택지 한국어",
      durationLabel: "진행 시간(분)",
      submitRoundAction: "봉인 라운드 만들기",
      notConnected: "연결 안 됨",
      questionEyebrow: "당신의 선택은?",
      sealed: "봉인됨",
      open: "진행중",
      final: "공개됨",
      ready: "공개",
      launch: "라운드 열기",
      voteA: "A 투표",
      voteB: "B 투표",
      skip: "패스",
      reveal: "결과 공개",
      receipts: "영수증",
      noRounds: "아직 진행 라운드가 없어요",
      noRoundsBody: "뉴 탭에서 첫 봉인 밸런스게임을 열어보세요.",
      sealedTitle: "실시간 결과 봉인",
      sealedBody: "Arcium이 라운드를 최종화할 때까지 아무도 결과를 볼 수 없어요.",
      finalResult: "최종 결과",
      optionAResult: "A",
      optionBResult: "B",
      skips: "패스",
      walletConnected: "지갑 연결됨",
      installWallet: "Phantom 또는 Solana 지갑을 설치하세요",
      fillFields: "필수 항목을 채워주세요",
      preparingRound: "봉인 라운드 준비 중",
      approveRound: "지갑에서 라운드 생성을 승인하세요",
      waitingInit: "Arcium 초기화 대기 중",
      roundReady: "Devnet에 라운드가 봉인됐어요",
      encrypting: "브라우저에서 선택지 암호화 중",
      preparingVote: "암호화 투표 준비 중",
      approveVote: "지갑에서 투표를 승인하세요",
      waitingVote: "Arcium 최종화 대기 중",
      voteFinalized: "암호화 투표 완료",
      preparingReveal: "결과 공개 준비 중",
      approveReveal: "지갑에서 결과 공개를 승인하세요",
      resultPublished: "최종 결과 공개 완료",
      alreadyFinalized: "이미 최종 결과가 공개됐어요",
      solanaDevnet: "Solana devnet",
      loading: "로딩",
      seconds: "초",
      minutes: "분",
      hours: "시간",
      days: "일"
    }
  };

  const state = {
    config: null,
    proposals: [],
    view: "hot",
    activeIndex: 0,
    language: readLanguage(),
    wallet: null,
    busy: false,
    loading: true,
    scrollCooldownUntil: 0,
    wheelDelta: 0,
    touchStartX: 0,
    touchStartY: 0,
    touchStartIndex: 0
  };

  const els = {
    walletButton: document.querySelector("[data-connect]"),
    profileConnect: document.querySelector("[data-profile-connect]"),
    brandTitle: document.querySelector("[data-brand-title]"),
    feedView: document.querySelector("[data-feed-view]"),
    profileView: document.querySelector("[data-profile-view]"),
    voteFeed: document.querySelector("[data-vote-feed]"),
    profileWallet: document.querySelector("[data-profile-wallet]"),
    profileRounds: document.querySelector("[data-profile-rounds]"),
    profileBank: document.querySelector("[data-profile-bank]"),
    profileNetwork: document.querySelector("[data-profile-network]"),
    profileProgram: document.querySelector("[data-profile-program]"),
    toast: document.querySelector("[data-toast]"),
    dialog: document.querySelector("[data-dialog]"),
    openDialog: document.querySelector("[data-open-dialog]"),
    closeDialog: document.querySelector("[data-close-dialog]"),
    createForm: document.querySelector("[data-create-form]")
  };

  function readLanguage() {
    try {
      return localStorage.getItem("would-you-dao-language") === "ko" ? "ko" : "en";
    } catch {
      return "en";
    }
  }

  function writeLanguage(language) {
    try {
      localStorage.setItem("would-you-dao-language", language);
    } catch {
      return;
    }
  }

  function t(key) {
    return COPY[state.language][key] || COPY.en[key] || key;
  }

  function text(value) {
    if (!value) return "";
    return value[state.language] || value.en || value.ko || "";
  }

  function showToast(message) {
    els.toast.textContent = message;
    els.toast.classList.add("is-visible");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(function () {
      els.toast.classList.remove("is-visible");
    }, 3200);
  }

  async function api(path, options) {
    const response = await fetch(path, {
      headers: {
        "Content-Type": "application/json"
      },
      ...options
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Request failed");
    return data;
  }

  function postJson(path, body) {
    return api(path, {
      method: "POST",
      body: JSON.stringify(body)
    });
  }

  async function refresh(options) {
    const silent = options && options.silent;
    try {
      if (!silent) state.loading = true;
      const data = await api("/api/status");
      state.config = data.config;
      state.proposals = data.proposals || [];
      state.activeIndex = Math.min(state.activeIndex, Math.max(feedItems().length - 1, 0));
    } catch (error) {
      showToast(error.message);
    } finally {
      state.loading = false;
      render();
    }
  }

  function walletProvider() {
    return window.solana && (window.solana.isPhantom || window.solana.publicKey)
      ? window.solana
      : null;
  }

  async function connectWallet() {
    const provider = walletProvider();
    if (!provider) {
      showToast(t("installWallet"));
      return null;
    }
    const response = await provider.connect();
    state.wallet = response.publicKey.toBase58();
    render();
    return state.wallet;
  }

  async function ensureWallet() {
    if (state.wallet) return state.wallet;
    return connectWallet();
  }

  function transactionFromBase64(value) {
    if (!window.solanaWeb3) throw new Error("Solana web3 bundle did not load");
    const raw = window.atob(value);
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
    return window.solanaWeb3.Transaction.from(bytes);
  }

  async function signAndSend(serializedTransaction) {
    const provider = walletProvider();
    if (!provider) throw new Error("Connect a Solana wallet first");

    const transaction = transactionFromBase64(serializedTransaction);
    if (provider.signAndSendTransaction) {
      const result = await provider.signAndSendTransaction(transaction);
      return typeof result === "string" ? result : result.signature;
    }

    if (provider.signTransaction) {
      const signed = await provider.signTransaction(transaction);
      const connection = new window.solanaWeb3.Connection(state.config.rpcUrl, "confirmed");
      return connection.sendRawTransaction(signed.serialize());
    }

    throw new Error("Wallet cannot sign Solana transactions");
  }

  function short(value) {
    if (!value) return "";
    return value.slice(0, 4) + "..." + value.slice(-4);
  }

  function walletLabel() {
    if (state.busy) return t("working");
    return state.wallet ? short(state.wallet) : t("connect");
  }

  function categoryById(id) {
    return bank.categories[id] || { en: "Community", ko: "커뮤니티" };
  }

  function roundMeta(proposal) {
    const title = proposal.title || "";
    const split = title.includes(" vs ") ? title.split(" vs ") : null;
    const fallbackA = split ? split[0] : title || t("noRounds");
    const fallbackB = split ? split.slice(1).join(" vs ") : "Take the other side";
    const sourceDilemma = proposal.slug
      ? bank.dilemmas.find(function (item) {
        return item.id === proposal.slug;
      })
      : null;
    const matchedCategory = proposal.category
      ? Object.entries(bank.categories).find(function ([, category]) {
        return category.en === proposal.category.en || category.ko === proposal.category.ko;
      })
      : null;
    const categoryId = sourceDilemma ? sourceDilemma.category : matchedCategory ? matchedCategory[0] : "daily";

    return {
      categoryId,
      category: proposal.category || categoryById(categoryId),
      prompt: proposal.prompt || {
        en: "Would you rather...",
        ko: "당신의 선택은?"
      },
      optionA: proposal.optionA || { en: fallbackA, ko: fallbackA },
      optionB: proposal.optionB || { en: fallbackB, ko: fallbackB }
    };
  }

  function dilemmaPayload(dilemma, durationMinutes) {
    const category = categoryById(dilemma.category);
    return {
      slug: dilemma.id,
      title: dilemma.a.en + " vs " + dilemma.b.en,
      summary: category.en + " balance round",
      quorum: 1,
      closesInSeconds: Math.max(1, durationMinutes) * 60,
      prompt: {
        en: "Would you rather...",
        ko: "당신의 선택은?"
      },
      category,
      optionA: dilemma.a,
      optionB: dilemma.b
    };
  }

  function customPayload(form) {
    const categoryId = String(form.get("category"));
    const category = categoryById(categoryId);
    const optionAEn = String(form.get("optionAEn")).trim();
    const optionBEn = String(form.get("optionBEn")).trim();
    const optionAKo = String(form.get("optionAKo")).trim();
    const optionBKo = String(form.get("optionBKo")).trim();
    const durationMinutes = Number(form.get("duration"));
    if (!optionAEn || !optionBEn || !durationMinutes) return null;
    const optionA = { en: optionAEn, ...(optionAKo ? { ko: optionAKo } : {}) };
    const optionB = { en: optionBEn, ...(optionBKo ? { ko: optionBKo } : {}) };

    return {
      slug: "custom-" + core.stableHash(optionAEn + optionBEn + Date.now()),
      title: optionA.en + " vs " + optionB.en,
      summary: category.en + " balance round",
      quorum: 1,
      closesInSeconds: Math.max(1, durationMinutes) * 60,
      prompt: {
        en: "Would you rather...",
        ko: "당신의 선택은?"
      },
      category,
      optionA,
      optionB
    };
  }

  function isClosed(proposal) {
    return proposal && Date.now() / 1000 >= proposal.closesAt;
  }

  function isVoteOpen(proposal) {
    return Boolean(proposal && !state.busy && !proposal.finalized && !isClosed(proposal) && proposal.encryptedStateChunks > 0);
  }

  function canTally(proposal) {
    return Boolean(state.wallet && proposal && !state.busy && !proposal.finalized && isClosed(proposal) && proposal.encryptedStateChunks > 0);
  }

  function formatStatus(proposal) {
    if (!proposal) return t("loading");
    if (proposal.finalized) return t("final");
    if (isClosed(proposal)) return t("ready");
    const diff = Math.ceil(proposal.closesAt - Date.now() / 1000);
    if (diff < 60) return diff + t("seconds");
    if (diff < 3600) return Math.ceil(diff / 60) + t("minutes");
    if (diff < 86400) return Math.ceil(diff / 3600) + t("hours");
    return Math.ceil(diff / 86400) + t("days");
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function feedItems() {
    if (state.view === "new") {
      return bank.dilemmas.map(function (dilemma) {
        return { type: "template", id: dilemma.id, dilemma };
      });
    }

    const proposals = state.proposals.slice().sort(function (a, b) {
      const heat = (b.receipts.length - a.receipts.length);
      return heat || (b.createdAt - a.createdAt);
    });

    return proposals.map(function (proposal) {
      return { type: "proposal", id: proposal.proposal, proposal };
    });
  }

  function resultBars(proposal, meta) {
    const result = {
      yes: proposal.yes,
      no: proposal.no,
      abstain: proposal.abstain,
      total: proposal.total
    };
    const percentages = core.resultPercentages(result);
    return [
      '<div class="result-block">',
      '<span>' + escapeHtml(t("finalResult")) + '</span>',
      resultRow("A · " + text(meta.optionA), result.yes, percentages.yes, "a"),
      resultRow("B · " + text(meta.optionB), result.no, percentages.no, "b"),
      resultRow(t("skips"), result.abstain, percentages.abstain, "skip"),
      '</div>'
    ].join("");
  }

  function resultRow(label, count, percent, tone) {
    return [
      '<div class="result-row result-row--' + tone + '">',
      '<strong>' + escapeHtml(label) + '</strong>',
      '<div><i style="width:' + percent + '%"></i></div>',
      '<span>' + count + '</span>',
      '</div>'
    ].join("");
  }

  function proposalCard(item, index) {
    const proposal = item.proposal;
    const meta = roundMeta(proposal);
    const disabled = !isVoteOpen(proposal) ? " disabled" : "";
    const status = proposal.finalized ? t("final") : isClosed(proposal) ? t("ready") : t("sealed");
    const action = proposal.finalized
      ? resultBars(proposal, meta)
      : [
          '<div class="vote-actions">',
          '<button class="choice-button choice-button--a" type="button" data-vote-proposal="' + proposal.proposal + '" data-choice="yes"' + disabled + '>',
          '<span>A</span><strong>' + escapeHtml(t("voteA")) + '</strong>',
          '</button>',
          '<button class="choice-button choice-button--b" type="button" data-vote-proposal="' + proposal.proposal + '" data-choice="no"' + disabled + '>',
          '<span>B</span><strong>' + escapeHtml(t("voteB")) + '</strong>',
          '</button>',
          '</div>',
          '<div class="secondary-row">',
          '<button type="button" data-skip-proposal="' + proposal.proposal + '"' + disabled + '>' + escapeHtml(t("skip")) + '</button>',
          isClosed(proposal) && !proposal.finalized
            ? '<button type="button" data-reveal-proposal="' + proposal.proposal + '">' + escapeHtml(t("reveal")) + '</button>'
            : '<span>' + proposal.receipts.length + ' ' + escapeHtml(t("receipts")) + '</span>',
          '</div>'
        ].join("");

    return [
      '<article class="vote-card" data-card-index="' + index + '">',
      '<div class="card-topline">',
      '<span>' + escapeHtml(text(meta.category)) + '</span>',
      '<strong>' + escapeHtml(status) + ' · ' + escapeHtml(formatStatus(proposal)) + '</strong>',
      '</div>',
      '<div class="question-copy">',
      '<span>' + escapeHtml(text(meta.prompt)) + '</span>',
      '<h1>' + escapeHtml(text(meta.optionA)) + '</h1>',
      '<div class="vs-line">vs</div>',
      '<h1>' + escapeHtml(text(meta.optionB)) + '</h1>',
      '</div>',
      action,
      '<p class="privacy-note">' + escapeHtml(t("sealedBody")) + '</p>',
      '</article>'
    ].join("");
  }

  function templateCard(item, index) {
    const dilemma = item.dilemma;
    const category = categoryById(dilemma.category);
    return [
      '<article class="vote-card vote-card--template" data-card-index="' + index + '">',
      '<div class="card-topline">',
      '<span>' + escapeHtml(text(category)) + '</span>',
      '<strong>' + escapeHtml(t("newTab")) + '</strong>',
      '</div>',
      '<div class="question-copy">',
      '<span>' + escapeHtml(t("questionEyebrow")) + '</span>',
      '<h1>' + escapeHtml(text(dilemma.a)) + '</h1>',
      '<div class="vs-line">vs</div>',
      '<h1>' + escapeHtml(text(dilemma.b)) + '</h1>',
      '</div>',
      '<button class="full-action" type="button" data-launch-dilemma="' + dilemma.id + '">' + escapeHtml(t("launch")) + '</button>',
      '<p class="privacy-note">' + escapeHtml(t("sealedBody")) + '</p>',
      '</article>'
    ].join("");
  }

  function emptyCard() {
    return [
      '<article class="vote-card">',
      '<div class="question-copy">',
      '<span>' + escapeHtml(t("sealedTitle")) + '</span>',
      '<h1>' + escapeHtml(t("noRounds")) + '</h1>',
      '<p>' + escapeHtml(t("noRoundsBody")) + '</p>',
      '</div>',
      '</article>'
    ].join("");
  }

  function renderFeed() {
    const items = feedItems();
    if (items.length === 0) {
      els.voteFeed.innerHTML = emptyCard();
      return;
    }
    els.voteFeed.innerHTML = items.map(function (item, index) {
      return item.type === "proposal" ? proposalCard(item, index) : templateCard(item, index);
    }).join("");
    requestAnimationFrame(function () {
      scrollToIndex(state.activeIndex, "auto");
    });
  }

  function renderCopy() {
    document.documentElement.lang = state.language === "ko" ? "ko" : "en";
    document.title = t("brandTitle");
    els.brandTitle.textContent = t("brandTitle");
    els.walletButton.querySelector("span").textContent = walletLabel();
    document.querySelectorAll("[data-copy]").forEach(function (node) {
      node.textContent = t(node.getAttribute("data-copy"));
    });
    document.querySelectorAll("[data-lang]").forEach(function (button) {
      button.classList.toggle("is-active", button.getAttribute("data-lang") === state.language);
    });
    document.querySelectorAll("[data-tab]").forEach(function (button) {
      button.classList.toggle("is-active", button.getAttribute("data-tab") === state.view);
    });
  }

  function renderDialogOptions() {
    const select = els.createForm.querySelector('select[name="category"]');
    select.innerHTML = Object.entries(bank.categories).map(function ([id, category]) {
      return '<option value="' + id + '">' + escapeHtml(text(category)) + '</option>';
    }).join("");
  }

  function renderProfile() {
    els.profileView.hidden = state.view !== "profile";
    els.feedView.hidden = state.view === "profile";
    els.profileWallet.textContent = state.wallet ? short(state.wallet) : t("notConnected");
    els.profileRounds.textContent = String(state.proposals.length);
    els.profileBank.textContent = String(bank.dilemmas.length);
    els.profileNetwork.textContent = t("solanaDevnet");
    els.profileProgram.textContent = state.config ? state.config.programId : t("loading");
  }

  function render() {
    renderCopy();
    renderDialogOptions();
    renderProfile();
    if (state.view !== "profile") renderFeed();
  }

  function scrollToIndex(index, behavior) {
    const cards = els.voteFeed.querySelectorAll(".vote-card");
    if (!cards.length) return;
    const nextIndex = Math.max(0, Math.min(index, cards.length - 1));
    state.activeIndex = nextIndex;
    els.voteFeed.scrollTo({
      top: cards[nextIndex].offsetTop,
      behavior: behavior || "smooth"
    });
  }

  function navigateBy(direction, fromIndex, cooldown) {
    if (state.view === "profile" || direction === 0 || Date.now() < state.scrollCooldownUntil) return false;
    state.scrollCooldownUntil = Date.now() + (cooldown || 100);
    scrollToIndex((fromIndex ?? state.activeIndex) + Math.sign(direction));
    return true;
  }

  function handleWheel(event) {
    if (state.view === "profile") return;
    const deltaX = event.deltaX || 0;
    const deltaY = event.deltaY || 0;
    if (Math.abs(deltaY) <= Math.abs(deltaX) || Math.abs(deltaY) < 1) return;
    event.preventDefault();

    state.wheelDelta = Math.sign(state.wheelDelta) === Math.sign(deltaY)
      ? state.wheelDelta + deltaY
      : deltaY;
    if (Math.abs(state.wheelDelta) < 28) return;

    if (navigateBy(state.wheelDelta > 0 ? 1 : -1)) {
      state.wheelDelta = 0;
    }
  }

  function resetScrollGuards() {
    state.scrollCooldownUntil = 0;
    state.wheelDelta = 0;
  }

  function handleTouchStart(event) {
    if (state.view === "profile" || event.touches.length !== 1) return;
    const touch = event.touches[0];
    state.touchStartX = touch.clientX;
    state.touchStartY = touch.clientY;
    state.touchStartIndex = state.activeIndex;
  }

  function handleTouchEnd(event) {
    if (state.view === "profile" || !event.changedTouches.length) return;
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - state.touchStartX;
    const deltaY = state.touchStartY - touch.clientY;
    if (Math.abs(deltaY) < 28 || Math.abs(deltaY) < Math.abs(deltaX)) return;
    navigateBy(deltaY > 0 ? 1 : -1, state.touchStartIndex, 100);
  }

  function handleTouchMove(event) {
    if (state.view === "profile" || !event.touches.length) return;
    const touch = event.touches[0];
    const deltaX = touch.clientX - state.touchStartX;
    const deltaY = touch.clientY - state.touchStartY;
    if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 8) {
      event.preventDefault();
    }
  }

  function handleKeyDown(event) {
    if (state.view === "profile") return;
    if (event.target.closest && event.target.closest("input, textarea, select, button, dialog")) return;
    if (event.key === "ArrowDown" || event.key === "PageDown" || event.key === " ") {
      event.preventDefault();
      navigateBy(1);
      return;
    }
    if (event.key === "ArrowUp" || event.key === "PageUp") {
      event.preventDefault();
      navigateBy(-1);
    }
  }

  async function createRound(payload) {
    const wallet = await ensureWallet();
    if (!wallet) return null;

    state.busy = true;
    render();
    showToast(t("preparingRound"));
    const prepared = await postJson("/api/wallet/proposal-tx", {
      publicKey: wallet,
      ...payload
    });
    showToast(t("approveRound"));
    const signature = await signAndSend(prepared.transaction.transaction);
    showToast(t("waitingInit"));
    const data = await postJson("/api/wallet/proposal-confirm", {
      publicKey: wallet,
      proposal: prepared.proposal,
      proposalId: prepared.proposalId,
      title: prepared.title,
      summary: prepared.summary,
      quorum: prepared.quorum,
      slug: prepared.slug,
      prompt: prepared.prompt,
      category: prepared.category,
      optionA: prepared.optionA,
      optionB: prepared.optionB,
      initComputationOffset: prepared.initComputationOffset,
      signature
    });
    state.view = "hot";
    state.activeIndex = 0;
    await refresh({ silent: true });
    showToast(t("roundReady"));
    return data;
  }

  async function submitVote(choice, proposalKey) {
    const proposal = state.proposals.find(function (item) {
      return item.proposal === proposalKey;
    });
    if (!proposal || !isVoteOpen(proposal)) return;

    try {
      const wallet = await ensureWallet();
      if (!wallet) return;
      if (!window.CipherDaoCrypto) throw new Error("Arcium browser crypto bundle did not load");
      state.busy = true;
      render();
      showToast(t("encrypting"));
      const encryption = await api("/api/vote-encryption");
      const encryptedVote = await window.CipherDaoCrypto.encryptVote({
        publicKey: wallet,
        choice,
        mxePublicKey: encryption.mxePublicKey
      });
      showToast(t("preparingVote"));
      const prepared = await postJson("/api/wallet/vote-tx", {
        publicKey: wallet,
        proposal: proposal.proposal,
        encryptedVote
      });
      showToast(t("approveVote"));
      const signature = await signAndSend(prepared.transaction.transaction);
      showToast(t("waitingVote"));
      await postJson("/api/wallet/vote-confirm", {
        publicKey: wallet,
        proposal: proposal.proposal,
        computationOffset: prepared.computationOffset,
        signature
      });
      await refresh({ silent: true });
      showToast(t("voteFinalized"));
    } catch (error) {
      showToast(error.message);
    } finally {
      state.busy = false;
      render();
    }
  }

  async function revealResult(proposalKey) {
    const proposal = state.proposals.find(function (item) {
      return item.proposal === proposalKey;
    });
    if (!proposal || !canTally(proposal)) return;

    try {
      const wallet = await ensureWallet();
      if (!wallet) return;
      state.busy = true;
      render();
      showToast(t("preparingReveal"));
      const prepared = await postJson("/api/wallet/tally-tx", {
        publicKey: wallet,
        proposal: proposal.proposal
      });
      if (prepared.alreadyFinalized) {
        await refresh({ silent: true });
        showToast(t("alreadyFinalized"));
        return;
      }
      showToast(t("approveReveal"));
      const signature = await signAndSend(prepared.transaction.transaction);
      showToast(t("waitingVote"));
      await postJson("/api/wallet/tally-confirm", {
        publicKey: wallet,
        proposal: proposal.proposal,
        computationOffset: prepared.computationOffset,
        signature
      });
      await refresh({ silent: true });
      showToast(t("resultPublished"));
    } catch (error) {
      showToast(error.message);
    } finally {
      state.busy = false;
      render();
    }
  }

  document.querySelectorAll("[data-tab]").forEach(function (button) {
    button.addEventListener("click", function () {
      state.view = button.getAttribute("data-tab");
      state.activeIndex = 0;
      resetScrollGuards();
      render();
    });
  });

  document.querySelectorAll("[data-lang]").forEach(function (button) {
    button.addEventListener("click", function () {
      state.language = button.getAttribute("data-lang") === "ko" ? "ko" : "en";
      writeLanguage(state.language);
      render();
    });
  });

  [els.walletButton, els.profileConnect].forEach(function (button) {
    button.addEventListener("click", async function () {
      try {
        const wallet = await connectWallet();
        if (wallet) showToast(t("walletConnected") + " " + short(wallet));
      } catch (error) {
        showToast(error.message);
      }
    });
  });

  els.voteFeed.addEventListener("wheel", handleWheel, { passive: false });
  els.voteFeed.addEventListener("touchstart", handleTouchStart, { passive: true });
  els.voteFeed.addEventListener("touchmove", handleTouchMove, { passive: false });
  els.voteFeed.addEventListener("touchend", handleTouchEnd, { passive: true });
  window.addEventListener("keydown", handleKeyDown);

  els.voteFeed.addEventListener("click", async function (event) {
    const voteButton = event.target.closest("[data-vote-proposal]");
    const skipButton = event.target.closest("[data-skip-proposal]");
    const revealButton = event.target.closest("[data-reveal-proposal]");
    const launchButton = event.target.closest("[data-launch-dilemma]");

    if (voteButton) {
      await submitVote(voteButton.getAttribute("data-choice"), voteButton.getAttribute("data-vote-proposal"));
      return;
    }
    if (skipButton) {
      await submitVote("abstain", skipButton.getAttribute("data-skip-proposal"));
      return;
    }
    if (revealButton) {
      await revealResult(revealButton.getAttribute("data-reveal-proposal"));
      return;
    }
    if (launchButton) {
      const dilemma = bank.dilemmas.find(function (item) {
        return item.id === launchButton.getAttribute("data-launch-dilemma");
      });
      if (!dilemma) return;
      try {
        await createRound(dilemmaPayload(dilemma, 5));
      } catch (error) {
        showToast(error.message);
      } finally {
        state.busy = false;
        render();
      }
    }
  });

  els.openDialog.addEventListener("click", function () {
    els.dialog.showModal();
  });

  els.closeDialog.addEventListener("click", function () {
    els.dialog.close();
  });

  els.createForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    const payload = customPayload(new FormData(els.createForm));
    if (!payload) {
      showToast(t("fillFields"));
      return;
    }

    try {
      els.dialog.close();
      await createRound(payload);
      els.createForm.reset();
    } catch (error) {
      showToast(error.message);
    } finally {
      state.busy = false;
      render();
    }
  });

  const provider = walletProvider();
  if (provider) {
    if (provider.isConnected && provider.publicKey) {
      state.wallet = provider.publicKey.toBase58();
    }
    provider.on && provider.on("connect", function (publicKey) {
      state.wallet = publicKey.toBase58();
      render();
    });
    provider.on && provider.on("disconnect", function () {
      state.wallet = null;
      render();
    });
    provider.on && provider.on("accountChanged", function (publicKey) {
      state.wallet = publicKey ? publicKey.toBase58() : null;
      render();
    });
  }

  window.setInterval(function () {
    if (!state.busy) refresh({ silent: true });
  }, 15000);

  render();
  refresh();
})();
