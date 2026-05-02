(function () {
  const core = window.GovernanceCore;
  const bank = window.BalanceDilemmas;

  const COPY = {
    en: {
      brandTitle: "Would You DAO?",
      brandSubtitle: "Started with hygiene dilemmas. Now judging all of life's impossible choices.",
      all: "All",
      connect: "Connect",
      working: "Working",
      liveRoundsEyebrow: "Live Rounds",
      liveRoundsTitle: "Sealed votes",
      questionEyebrow: "Would you rather...",
      voteAction: "Vote privately",
      skipAction: "Skip",
      receiptsMetric: "Receipts",
      roundStatusMetric: "Status",
      categoryMetric: "Category",
      resultEyebrow: "Result reveal",
      ledgerEyebrow: "Public ledger",
      ledgerTitle: "Encrypted receipts",
      proofEyebrow: "Verified privacy",
      queueEyebrow: "Question Bank",
      queueTitle: "Launch a round",
      customRoundTitle: "Custom round",
      categoryLabel: "Category",
      optionAEnLabel: "Option A in English",
      optionBEnLabel: "Option B in English",
      optionAKoLabel: "Option A in Korean",
      optionBKoLabel: "Option B in Korean",
      durationLabel: "Duration minutes",
      createRoundAction: "Create sealed round",
      open: "Open",
      sealed: "Sealed",
      final: "Final",
      ready: "Reveal",
      loading: "Loading rounds",
      emptyTitle: "No sealed rounds yet",
      emptySummary: "Launch a balance-game round from the question bank.",
      noReceipts: "No encrypted receipts yet",
      sealedTitle: "Live split is sealed",
      sealedBody: "Choices are encrypted in the browser and tallied by Arcium after the round closes.",
      proofWaiting: "Waiting",
      initializing: "Initializing",
      mpcPending: "MPC execution pending",
      readyToReveal: "Ready to reveal",
      verified: "Verified Arcium callback",
      revealAction: "Reveal final result",
      launch: "Launch",
      voteA: "A votes",
      voteB: "B votes",
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
      connecting: "Connecting",
      seconds: "s remaining",
      minutes: "m remaining",
      hours: "h remaining",
      days: "d remaining"
    },
    ko: {
      brandTitle: "씻었DAO",
      brandSubtitle: "처음엔 씻었냐로 시작했지만, 이제 인생의 모든 밸런스를 판결합니다.",
      all: "전체",
      connect: "지갑 연결",
      working: "처리 중",
      liveRoundsEyebrow: "진행 중",
      liveRoundsTitle: "봉인된 투표",
      questionEyebrow: "당신의 선택은?",
      voteAction: "비공개 투표",
      skipAction: "패스",
      receiptsMetric: "영수증",
      roundStatusMetric: "상태",
      categoryMetric: "카테고리",
      resultEyebrow: "결과 공개",
      ledgerEyebrow: "공개 장부",
      ledgerTitle: "암호화 영수증",
      proofEyebrow: "검증된 프라이버시",
      queueEyebrow: "질문 창고",
      queueTitle: "라운드 열기",
      customRoundTitle: "직접 만들기",
      categoryLabel: "카테고리",
      optionAEnLabel: "A 선택지 영어",
      optionBEnLabel: "B 선택지 영어",
      optionAKoLabel: "A 선택지 한국어",
      optionBKoLabel: "B 선택지 한국어",
      durationLabel: "진행 시간(분)",
      createRoundAction: "봉인 라운드 만들기",
      open: "진행 중",
      sealed: "봉인됨",
      final: "공개됨",
      ready: "공개 가능",
      loading: "라운드 불러오는 중",
      emptyTitle: "아직 열린 라운드가 없어요",
      emptySummary: "질문 창고에서 밸런스게임 라운드를 열어보세요.",
      noReceipts: "아직 암호화 영수증이 없어요",
      sealedTitle: "실시간 결과는 봉인됨",
      sealedBody: "선택지는 브라우저에서 암호화되고, 마감 후 Arcium이 집계합니다.",
      proofWaiting: "대기 중",
      initializing: "초기화 중",
      mpcPending: "MPC 실행 대기",
      readyToReveal: "공개 가능",
      verified: "Arcium 콜백 검증 완료",
      revealAction: "최종 결과 공개",
      launch: "열기",
      voteA: "A 득표",
      voteB: "B 득표",
      skips: "패스",
      walletConnected: "지갑 연결됨",
      installWallet: "Phantom 또는 Solana 지갑을 설치하세요",
      fillFields: "필수 라운드 항목을 채워주세요",
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
      connecting: "연결 중",
      seconds: "초 남음",
      minutes: "분 남음",
      hours: "시간 남음",
      days: "일 남음"
    }
  };

  const state = {
    config: null,
    proposals: [],
    selectedProposalId: null,
    selectedChoice: "yes",
    selectedCategory: "all",
    language: readLanguage(),
    wallet: null,
    busy: false,
    loading: true
  };

  const els = {
    walletButton: document.querySelector("[data-connect]"),
    clusterLabel: document.querySelector("[data-cluster-label]"),
    brandTitle: document.querySelector("[data-brand-title]"),
    brandSubtitle: document.querySelector("[data-brand-subtitle]"),
    categoryStrip: document.querySelector("[data-category-strip]"),
    roundList: document.querySelector("[data-round-list]"),
    templateList: document.querySelector("[data-template-list]"),
    roundCategory: document.querySelector("[data-round-category]"),
    roundStatus: document.querySelector("[data-round-status]"),
    roundQuestion: document.querySelector("[data-round-question]"),
    optionAText: document.querySelector("[data-option-a-text]"),
    optionBText: document.querySelector("[data-option-b-text]"),
    castButton: document.querySelector("[data-cast-vote]"),
    skipButton: document.querySelector("[data-skip-vote]"),
    finalizeButton: document.querySelector("[data-finalize]"),
    closeLabel: document.querySelector("[data-close-label]"),
    receiptCount: document.querySelector("[data-receipt-count]"),
    categoryValue: document.querySelector("[data-category-value]"),
    receipts: document.querySelector("[data-receipts]"),
    tally: document.querySelector("[data-tally]"),
    proof: document.querySelector("[data-proof]"),
    proofState: document.querySelector("[data-proof-state]"),
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

  function selectedProposal() {
    const visible = visibleProposals();
    return visible.find(function (proposal) {
      return proposal.proposal === state.selectedProposalId;
    }) || visible[0] || null;
  }

  function visibleProposals() {
    if (state.selectedCategory === "all") return state.proposals;
    return state.proposals.filter(function (proposal) {
      return roundMeta(proposal).categoryId === state.selectedCategory;
    });
  }

  function visibleDilemmas() {
    const dilemmas = bank.dilemmas;
    if (state.selectedCategory === "all") return dilemmas;
    return dilemmas.filter(function (dilemma) {
      return dilemma.category === state.selectedCategory;
    });
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
    if (!response.ok) {
      throw new Error(data.error || "Request failed");
    }
    return data;
  }

  async function refresh(options) {
    const silent = options && options.silent;
    try {
      if (!silent) state.loading = true;
      const data = await api("/api/status");
      state.config = data.config;
      state.proposals = data.proposals || [];
      const visible = visibleProposals();
      if (!state.selectedProposalId && visible.length > 0) {
        state.selectedProposalId = visible[0].proposal;
      }
      if (state.selectedProposalId && !state.proposals.some(function (proposal) {
        return proposal.proposal === state.selectedProposalId;
      })) {
        state.selectedProposalId = visible[0] ? visible[0].proposal : null;
      }
    } catch (error) {
      showToast(error.message);
    } finally {
      state.loading = false;
      render();
    }
  }

  function setBusy(value, message) {
    state.busy = value;
    if (message) showToast(message);
    render();
  }

  function postJson(path, body) {
    return api(path, {
      method: "POST",
      body: JSON.stringify(body)
    });
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
    if (!window.solanaWeb3) {
      throw new Error("Solana web3 bundle did not load");
    }
    const raw = window.atob(value);
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i += 1) {
      bytes[i] = raw.charCodeAt(i);
    }
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
    return value.slice(0, 6) + "..." + value.slice(-6);
  }

  function walletLabel() {
    if (state.busy) return t("working");
    return state.wallet ? short(state.wallet) : t("connect");
  }

  function explorerTx(signature) {
    return "https://explorer.solana.com/tx/" + signature + "?cluster=devnet";
  }

  function formatClose(proposal) {
    if (!proposal) return state.loading ? t("loading") : t("open");
    if (proposal.finalized) return t("final");
    const diff = Math.ceil(proposal.closesAt - Date.now() / 1000);
    if (diff <= 0) return t("ready");
    if (diff < 60) return diff + t("seconds");
    if (diff < 3600) return Math.ceil(diff / 60) + t("minutes");
    if (diff < 86400) return Math.ceil(diff / 3600) + t("hours");
    return Math.ceil(diff / 86400) + t("days");
  }

  function isClosed(proposal) {
    return proposal && Date.now() / 1000 >= proposal.closesAt;
  }

  function isVoteOpen(proposal) {
    return Boolean(proposal && !state.busy && !proposal.finalized && !isClosed(proposal) && proposal.encryptedStateChunks > 0);
  }

  function canVote(proposal) {
    return Boolean(state.wallet && isVoteOpen(proposal));
  }

  function canTally(proposal) {
    return Boolean(state.wallet && proposal && !state.busy && !proposal.finalized && isClosed(proposal) && proposal.encryptedStateChunks > 0);
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function categoryById(id) {
    return bank.categories[id] || { en: "Community", ko: "커뮤니티" };
  }

  function roundMeta(proposal) {
    const title = proposal.title || "";
    const split = title.includes(" vs ") ? title.split(" vs ") : null;
    const fallbackA = split ? split[0] : title || t("emptyTitle");
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
      slug: proposal.slug || "",
      categoryId,
      category: proposal.category || categoryById(categoryId),
      prompt: proposal.prompt || {
        en: "Which side wins this sealed round?",
        ko: "이번 봉인 라운드의 승자는?"
      },
      optionA: proposal.optionA || { en: fallbackA, ko: fallbackA },
      optionB: proposal.optionB || { en: fallbackB, ko: fallbackB }
    };
  }

  function dilemmaPayload(dilemma, durationMinutes) {
    const category = categoryById(dilemma.category);
    const optionA = dilemma.a;
    const optionB = dilemma.b;
    return {
      slug: dilemma.id,
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

  function customPayload(form) {
    const categoryId = String(form.get("category"));
    const category = categoryById(categoryId);
    const optionAEn = String(form.get("optionAEn")).trim();
    const optionBEn = String(form.get("optionBEn")).trim();
    const optionAKo = String(form.get("optionAKo")).trim();
    const optionBKo = String(form.get("optionBKo")).trim();
    const durationMinutes = Number(form.get("duration"));
    if (!optionAEn || !optionBEn || !durationMinutes) return null;
    const slug = "custom-" + core.stableHash(optionAEn + optionBEn + Date.now());
    const optionA = { en: optionAEn, ...(optionAKo ? { ko: optionAKo } : {}) };
    const optionB = { en: optionBEn, ...(optionBKo ? { ko: optionBKo } : {}) };

    return {
      slug,
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

  async function createRound(payload) {
    const wallet = await ensureWallet();
    if (!wallet) return null;

    setBusy(true, t("preparingRound"));
    const prepared = await postJson("/api/wallet/proposal-tx", {
      publicKey: wallet,
      ...payload
    });
    showToast(t("approveRound"));
    const signature = await signAndSend(prepared.transaction.transaction);
    setBusy(true, t("waitingInit"));
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
    state.selectedProposalId = data.proposal.proposal;
    await refresh({ silent: true });
    showToast(t("roundReady"));
    return data;
  }

  async function submitVote(choice) {
    const proposal = selectedProposal();
    if (!proposal || !isVoteOpen(proposal)) return;

    try {
      const wallet = await ensureWallet();
      if (!wallet) return;
      if (!window.CipherDaoCrypto) {
        throw new Error("Arcium browser crypto bundle did not load");
      }
      state.selectedChoice = choice;
      setBusy(true, t("encrypting"));
      const encryption = await api("/api/vote-encryption");
      const encryptedVote = await window.CipherDaoCrypto.encryptVote({
        publicKey: wallet,
        choice,
        mxePublicKey: encryption.mxePublicKey
      });
      setBusy(true, t("preparingVote"));
      const prepared = await postJson("/api/wallet/vote-tx", {
        publicKey: wallet,
        proposal: proposal.proposal,
        encryptedVote
      });
      showToast(t("approveVote"));
      const signature = await signAndSend(prepared.transaction.transaction);
      setBusy(true, t("waitingVote"));
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
      setBusy(false);
    }
  }

  function tallyRow(label, count, percent, tone) {
    return [
      '<div class="tally-row tally-row--' + tone + '">',
      '<span>' + escapeHtml(label) + '</span>',
      '<div class="tally-bar"><i style="width:' + percent + '%"></i></div>',
      '<strong>' + count + '</strong>',
      '</div>'
    ].join("");
  }

  function renderCopy() {
    document.documentElement.lang = state.language === "ko" ? "ko" : "en";
    document.title = t("brandTitle");
    els.brandTitle.textContent = t("brandTitle");
    els.brandSubtitle.textContent = t("brandSubtitle");
    document.querySelectorAll("[data-copy]").forEach(function (node) {
      node.textContent = t(node.getAttribute("data-copy"));
    });
    document.querySelectorAll("[data-lang]").forEach(function (button) {
      button.classList.toggle("is-active", button.getAttribute("data-lang") === state.language);
    });
  }

  function renderDialogOptions() {
    const select = els.createForm.querySelector('select[name="category"]');
    select.innerHTML = Object.entries(bank.categories).map(function ([id, category]) {
      return '<option value="' + id + '">' + escapeHtml(text(category)) + '</option>';
    }).join("");
  }

  function renderCategories() {
    const items = [["all", { en: t("all"), ko: t("all") }]].concat(Object.entries(bank.categories));
    els.categoryStrip.innerHTML = items.map(function (entry) {
      const id = Array.isArray(entry) ? entry[0] : entry;
      const category = Array.isArray(entry) ? entry[1] : bank.categories[entry];
      const active = state.selectedCategory === id ? " is-active" : "";
      return '<button class="category-filter' + active + '" type="button" data-category="' + id + '">' + escapeHtml(text(category)) + '</button>';
    }).join("");
  }

  function renderRoundList(selected) {
    const proposals = visibleProposals();
    if (proposals.length === 0) {
      els.roundList.innerHTML = [
        '<div class="empty-block">',
        '<strong>' + escapeHtml(t("emptyTitle")) + '</strong>',
        '<span>' + escapeHtml(t("emptySummary")) + '</span>',
        '</div>'
      ].join("");
      return;
    }

    els.roundList.innerHTML = proposals.map(function (proposal) {
      const meta = roundMeta(proposal);
      const active = selected && proposal.proposal === selected.proposal ? " is-active" : "";
      const status = proposal.finalized ? t("final") : isClosed(proposal) ? t("ready") : t("open");
      return [
        '<button class="round-item' + active + '" type="button" data-select-proposal="' + proposal.proposal + '">',
        '<span class="round-item__top">',
        '<strong>' + escapeHtml(text(meta.optionA)) + '</strong>',
        '<i>' + escapeHtml(status) + '</i>',
        '</span>',
        '<span class="round-item__vs">vs ' + escapeHtml(text(meta.optionB)) + '</span>',
        '<span class="round-item__meta">' + escapeHtml(text(meta.category)) + ' · ' + proposal.receipts.length + '</span>',
        '</button>'
      ].join("");
    }).join("");
  }

  function renderTemplates() {
    els.templateList.innerHTML = visibleDilemmas().slice(0, 12).map(function (dilemma) {
      const category = categoryById(dilemma.category);
      return [
        '<article class="template-item">',
        '<span>' + escapeHtml(text(category)) + '</span>',
        '<strong>' + escapeHtml(text(dilemma.a)) + '</strong>',
        '<p>vs ' + escapeHtml(text(dilemma.b)) + '</p>',
        '<button type="button" data-launch-dilemma="' + dilemma.id + '">' + escapeHtml(t("launch")) + '</button>',
        '</article>'
      ].join("");
    }).join("");
  }

  function renderEmpty() {
    renderCopy();
    renderDialogOptions();
    renderCategories();
    renderTemplates();
    els.clusterLabel.textContent = state.config ? t("solanaDevnet") : t("connecting");
    els.walletButton.querySelector("span").textContent = walletLabel();
    els.roundCategory.textContent = text(categoryById("daily"));
    els.roundStatus.textContent = t("sealed");
    els.roundQuestion.textContent = state.loading ? t("loading") : t("emptyTitle");
    els.optionAText.textContent = t("emptySummary");
    els.optionBText.textContent = t("queueTitle");
    els.closeLabel.textContent = t("open");
    els.receiptCount.textContent = "0";
    els.categoryValue.textContent = text(categoryById("daily"));
    els.receipts.innerHTML = "";
    els.tally.innerHTML = '<div class="sealed-tally"><strong>' + escapeHtml(t("sealedTitle")) + '</strong><span>' + escapeHtml(t("sealedBody")) + '</span></div>';
    els.proof.textContent = t("proofWaiting");
    els.proofState.textContent = state.wallet ? t("walletConnected") : t("connect");
    els.castButton.disabled = true;
    els.skipButton.disabled = true;
    els.finalizeButton.disabled = true;
    renderRoundList(null);
    bindDynamicEvents();
  }

  function render() {
    renderCopy();
    renderDialogOptions();
    renderCategories();
    renderTemplates();

    const proposal = selectedProposal();
    if (!proposal) {
      renderEmpty();
      return;
    }

    const meta = roundMeta(proposal);
    const result = {
      yes: proposal.yes,
      no: proposal.no,
      abstain: proposal.abstain,
      total: proposal.total
    };
    const percentages = proposal.finalized ? core.resultPercentages(result) : null;

    els.clusterLabel.textContent = state.config ? t("solanaDevnet") : t("connecting");
    els.walletButton.querySelector("span").textContent = walletLabel();
    els.roundCategory.textContent = text(meta.category);
    els.roundStatus.textContent = proposal.finalized ? t("final") : isClosed(proposal) ? t("ready") : t("sealed");
    els.roundQuestion.textContent = text(meta.prompt);
    els.optionAText.textContent = text(meta.optionA);
    els.optionBText.textContent = text(meta.optionB);
    els.closeLabel.textContent = formatClose(proposal);
    els.receiptCount.textContent = String(proposal.receipts.length);
    els.categoryValue.textContent = text(meta.category);
    els.castButton.disabled = !canVote(proposal);
    els.skipButton.disabled = !canVote(proposal);
    els.finalizeButton.disabled = !canTally(proposal);

    document.querySelectorAll("[data-choice]").forEach(function (button) {
      button.classList.toggle("is-selected", button.getAttribute("data-choice") === state.selectedChoice);
      button.disabled = !isVoteOpen(proposal);
    });

    renderRoundList(proposal);

    if (proposal.receipts.length === 0) {
      els.receipts.innerHTML = '<li><span>' + escapeHtml(t("noReceipts")) + '</span><code>' + short(proposal.proposal) + '</code></li>';
    } else {
      els.receipts.innerHTML = proposal.receipts.slice().reverse().map(function (receipt) {
        return [
          '<li>',
          '<span>' + short(receipt.signature) + '</span>',
          '<a href="' + explorerTx(receipt.signature) + '" target="_blank" rel="noreferrer">' + short(receipt.finalizeSignature) + '</a>',
          '</li>'
        ].join("");
      }).join("");
    }

    if (proposal.finalized) {
      els.tally.innerHTML = [
        tallyRow("A · " + text(meta.optionA), result.yes, percentages.yes, "a"),
        tallyRow("B · " + text(meta.optionB), result.no, percentages.no, "b"),
        tallyRow(t("skips"), result.abstain, percentages.abstain, "skip")
      ].join("");
      els.proof.textContent = proposal.tallyFinalizeSignature ? short(proposal.tallyFinalizeSignature) : short(proposal.proposal);
      els.proofState.textContent = t("verified");
    } else {
      els.tally.innerHTML = [
        '<div class="sealed-tally">',
        '<strong>' + escapeHtml(t("sealedTitle")) + '</strong>',
        '<span>' + escapeHtml(t("sealedBody")) + '</span>',
        '</div>'
      ].join("");
      els.proof.textContent = proposal.stateNonce === "0" ? t("initializing") : short(proposal.stateNonce);
      els.proofState.textContent = isClosed(proposal) ? t("readyToReveal") : t("mpcPending");
    }

    bindDynamicEvents();
  }

  function bindDynamicEvents() {
    document.querySelectorAll("[data-select-proposal]").forEach(function (button) {
      button.addEventListener("click", function () {
        state.selectedProposalId = button.getAttribute("data-select-proposal");
        render();
      });
    });

    document.querySelectorAll("[data-category]").forEach(function (button) {
      button.addEventListener("click", function () {
        state.selectedCategory = button.getAttribute("data-category");
        const visible = visibleProposals();
        state.selectedProposalId = visible[0] ? visible[0].proposal : state.selectedProposalId;
        render();
      });
    });

    document.querySelectorAll("[data-launch-dilemma]").forEach(function (button) {
      button.addEventListener("click", async function () {
        const dilemma = bank.dilemmas.find(function (item) {
          return item.id === button.getAttribute("data-launch-dilemma");
        });
        if (!dilemma) return;
        try {
          await createRound(dilemmaPayload(dilemma, 5));
        } catch (error) {
          showToast(error.message);
        } finally {
          setBusy(false);
        }
      });
    });
  }

  document.querySelectorAll("[data-lang]").forEach(function (button) {
    button.addEventListener("click", function () {
      state.language = button.getAttribute("data-lang") === "ko" ? "ko" : "en";
      writeLanguage(state.language);
      render();
    });
  });

  document.querySelectorAll("[data-choice]").forEach(function (button) {
    button.addEventListener("click", function () {
      if (button.disabled) return;
      state.selectedChoice = button.getAttribute("data-choice");
      render();
    });
  });

  els.walletButton.addEventListener("click", async function () {
    try {
      const wallet = await connectWallet();
      if (wallet) showToast(t("walletConnected") + " " + short(wallet));
    } catch (error) {
      showToast(error.message);
    }
  });

  els.castButton.addEventListener("click", function () {
    submitVote(state.selectedChoice);
  });

  els.skipButton.addEventListener("click", function () {
    submitVote("abstain");
  });

  els.finalizeButton.addEventListener("click", async function () {
    const proposal = selectedProposal();
    if (!proposal || !canTally(proposal)) return;
    try {
      const wallet = await ensureWallet();
      if (!wallet) return;
      setBusy(true, t("preparingReveal"));
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
      setBusy(true, t("waitingVote"));
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
      setBusy(false);
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
      setBusy(false);
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
    if (!state.busy) render();
  }, 1000);

  window.setInterval(function () {
    if (!state.busy) refresh({ silent: true });
  }, 15000);

  render();
  refresh();
})();
