(function () {
  const core = window.GovernanceCore;
  const bank = window.BalanceDilemmas;

  const COPY = {
    en: {
      brandTitle: "Would You DAO?",
      connect: "Connect",
      aboutAction: "About",
      aboutTitle: "Why Arcium?",
      aboutKicker: "Absurd questions. Serious privacy.",
      aboutBody: "Would You DAO asks questions people answer more honestly when nobody can watch the live split. Arcium lets each wallet submit an encrypted choice, keeps the shared tally sealed during the round, and publishes only the final verified result to Solana.",
      aboutPrivateTitle: "Private by default",
      aboutPrivateBody: "Your vote should not become a social signal before the round ends. Whether the question is silly, embarrassing, or oddly personal, voters can participate without broadcasting the choice early.",
      aboutProofTitle: "Still accountable",
      aboutProofBody: "Privacy does not mean vague results. The round publishes a final tally with correctness checks, so the community sees the outcome without exposing each voter's path.",
      aboutFooter: "Funny choices, professional secrecy.",
      working: "Working",
      hotTab: "Finalized",
      newTab: "New",
      profileTab: "Profile",
      profileEyebrow: "Profile",
      profileTitle: "Private voting settings",
      profileBody: "Choose your language, connect your wallet, and launch custom sealed rounds.",
      walletLabel: "Wallet",
      connectWalletAction: "Connect wallet",
      connectedWalletAction: "Wallet connected",
      languageLabel: "Language",
      liveRoundsLabel: "Live rounds",
      questionBankLabel: "Question bank",
      networkLabel: "Network",
      privacyEyebrow: "Sealed by Arcium",
      privacyBody: "Choices are encrypted in your browser. Live results stay hidden until the round closes and Arcium publishes the verified final tally.",
      createRoundAction: "Create custom round",
      customRoundTitle: "Custom round",
      categoryLabel: "Category",
      allCategories: "All",
      optionALabel: "Option A",
      optionBLabel: "Option B",
      durationLabel: "Duration minutes",
      submitRoundAction: "Create sealed round",
      notConnected: "Not connected",
      questionEyebrow: "Would you rather...",
      sealed: "Broadcasting",
      open: "Open",
      final: "Final",
      ready: "Reveal",
      voteA: "Vote A",
      voteB: "Vote B",
      skip: "Skip",
      reveal: "Reveal result",
      receipts: "receipts",
      noRounds: "No live rounds yet",
      noRoundsBody: "Use the plus button to launch a sealed balance game.",
      sealedTitle: "Live split sealed",
      finalResult: "Final result",
      optionAResult: "A",
      optionBResult: "B",
      votesLabel: "votes",
      skips: "Skips",
      walletConnected: "Wallet connected",
      installWallet: "Install Phantom or another Solana wallet",
      fillFields: "Fill the required round fields",
      translating: "Translating choices",
      translateFailed: "Translation failed",
      preparingRound: "Preparing sealed round",
      launchingSeed: "Launching this seeded round on Solana",
      seedPending: "Round submitted. Arcium is preparing the private state; try voting again soon.",
      approveRound: "Approve round in wallet",
      waitingInit: "Waiting for Arcium initialization",
      roundReady: "Round sealed on devnet",
      encrypting: "Encrypting choice in browser",
      preparingVote: "Preparing encrypted vote",
      approveVote: "Approve vote in wallet",
      waitingVote: "Waiting for Arcium finalization",
      voteFinalized: "Encrypted vote finalized",
      voteQueued: "Vote submitted. Arcium finalization is still running.",
      preparingReveal: "Preparing reveal",
      approveReveal: "Approve reveal in wallet",
      resultPublished: "Final result published",
      resultQueued: "Reveal submitted. Arcium finalization is still running.",
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
      aboutAction: "소개",
      aboutTitle: "왜 Arcium인가요?",
      aboutKicker: "질문은 이상해도 프라이버시는 진지하게.",
      aboutBody: "씻었DAO는 실시간 표 흐름이 보이면 사람들이 솔직하게 고르기 어려운 질문을 다룹니다. Arcium은 각 지갑의 선택을 암호화해서 제출하고, 라운드 중 공유 tally를 봉인한 뒤, Solana에는 검증 가능한 최종 결과만 공개하게 해줍니다.",
      aboutPrivateTitle: "기본값은 비공개",
      aboutPrivateBody: "투표가 끝나기도 전에 내 선택이 사회적 신호가 되면 사람들은 눈치를 보게 됩니다. 질문이 웃기거나, 민망하거나, 이상하게 개인적이어도 선택이 먼저 노출되지 않도록 설계했습니다.",
      aboutProofTitle: "그래도 결과는 책임 있게",
      aboutProofBody: "프라이버시가 대충 집계한다는 뜻은 아닙니다. 라운드는 정확성 검사를 거친 최종 tally를 공개하므로, 커뮤니티는 각자의 선택 경로를 보지 않고도 결과를 확인할 수 있습니다.",
      aboutFooter: "웃긴 선택지, 프로페셔널한 비밀 유지.",
      working: "처리중",
      hotTab: "완료",
      newTab: "뉴",
      profileTab: "프로필",
      profileEyebrow: "프로필",
      profileTitle: "비공개 투표 설정",
      profileBody: "언어를 바꾸고, 지갑을 연결하고, 직접 봉인 라운드를 열 수 있어요.",
      walletLabel: "지갑",
      connectWalletAction: "지갑 연결",
      connectedWalletAction: "지갑 연결됨",
      languageLabel: "언어",
      liveRoundsLabel: "진행 라운드",
      questionBankLabel: "질문 수",
      networkLabel: "네트워크",
      privacyEyebrow: "Arcium으로 봉인",
      privacyBody: "선택지는 브라우저에서 암호화됩니다. 실시간 결과는 숨겨지고, 마감 후 Arcium이 검증된 최종 결과만 공개합니다.",
      createRoundAction: "직접 라운드 만들기",
      customRoundTitle: "직접 만들기",
      categoryLabel: "카테고리",
      allCategories: "전체",
      optionALabel: "A 선택지",
      optionBLabel: "B 선택지",
      durationLabel: "진행 시간(분)",
      submitRoundAction: "봉인 라운드 만들기",
      notConnected: "연결 안 됨",
      questionEyebrow: "당신의 선택은?",
      sealed: "진행중",
      open: "진행중",
      final: "공개됨",
      ready: "공개",
      voteA: "A 투표",
      voteB: "B 투표",
      skip: "패스",
      reveal: "결과 공개",
      receipts: "영수증",
      noRounds: "아직 진행 라운드가 없어요",
      noRoundsBody: "+ 버튼으로 봉인 밸런스게임을 열어보세요.",
      sealedTitle: "실시간 결과 봉인",
      finalResult: "최종 결과",
      optionAResult: "A",
      optionBResult: "B",
      votesLabel: "표",
      skips: "패스",
      walletConnected: "지갑 연결됨",
      installWallet: "Phantom 또는 Solana 지갑을 설치하세요",
      fillFields: "필수 항목을 채워주세요",
      translating: "선택지 번역 중",
      translateFailed: "번역 실패",
      preparingRound: "봉인 라운드 준비 중",
      launchingSeed: "이 시드 질문을 Solana 라운드로 런치하는 중",
      seedPending: "라운드가 제출됐고 Arcium 비공개 상태를 준비 중이에요. 잠시 후 다시 투표해 주세요.",
      approveRound: "지갑에서 라운드 생성을 승인하세요",
      waitingInit: "Arcium 초기화 대기 중",
      roundReady: "Devnet에 라운드가 봉인됐어요",
      encrypting: "브라우저에서 선택지 암호화 중",
      preparingVote: "암호화 투표 준비 중",
      approveVote: "지갑에서 투표를 승인하세요",
      waitingVote: "Arcium 최종화 대기 중",
      voteFinalized: "암호화 투표 완료",
      voteQueued: "투표가 제출됐고 Arcium 최종화가 계속 진행 중이에요",
      preparingReveal: "결과 공개 준비 중",
      approveReveal: "지갑에서 결과 공개를 승인하세요",
      resultPublished: "최종 결과 공개 완료",
      resultQueued: "결과 공개가 제출됐고 Arcium 최종화가 계속 진행 중이에요",
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
    categoryFilters: [],
    activeIndex: 0,
    language: readLanguage(),
    wallet: null,
    busy: false,
    loading: true,
    scrollCooldownUntil: 0,
    wheelGestureLocked: false,
    wheelIdleTimer: 0,
    wheelFallbackTimer: 0,
    wheelDelta: 0,
    touchStartX: 0,
    touchStartY: 0,
    touchStartIndex: 0,
    categoryDrag: null,
    categoryDragSuppressClick: false
  };

  const els = {
    walletButton: document.querySelector("[data-connect]"),
    topbarNewVote: document.querySelector("[data-topbar-new-vote]"),
    profileConnect: document.querySelector("[data-profile-connect]"),
    aboutOpen: document.querySelector("[data-about-open]"),
    aboutDialog: document.querySelector("[data-about-dialog]"),
    closeAbout: document.querySelector("[data-close-about]"),
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
    const selected = value[state.language] || value.en || value.ko || "";
    return /[A-Za-z]/.test(selected) ? normalizeEnglishPerspective(selected) : selected;
  }

  function englishText(value, fallback) {
    if (!value) return fallback || "";
    return normalizeEnglishOptionText(value.en || value.ko || fallback || "");
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
    const raw = await response.text();
    let data = {};
    if (raw.trim()) {
      try {
        data = JSON.parse(raw);
      } catch {
        throw new Error(response.ok
          ? "Server returned a non-JSON response"
          : raw.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 180) || "Request failed");
      }
    }
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

  const HANGUL_PATTERN = /[\u3131-\u318e\uac00-\ud7a3]/;

  function formText(form, name) {
    return String(form.get(name) || "").trim();
  }

  function detectOptionLanguage(value) {
    return HANGUL_PATTERN.test(value) ? "ko" : "en";
  }

  async function translateItems(from, to, category, items) {
    const data = await postJson("/api/translate", { from, to, category, items });
    return data.items && typeof data.items === "object" ? data.items : {};
  }

  function formatDollarAmount(amount) {
    const rounded = Math.round(amount * 100) / 100;
    return "$" + rounded.toLocaleString("en-US", {
      maximumFractionDigits: Number.isInteger(rounded) ? 0 : 2
    });
  }

  function normalizeEnglishWonAmounts(value) {
    return String(value).replace(/\b(\d+(?:,\d{3})*(?:\.\d+)?)\s*(thousand|million|billion)?\s+won\b/gi, function (_, rawAmount, unit) {
      const base = Number(String(rawAmount).replaceAll(",", ""));
      const multiplier = unit && unit.toLowerCase() === "billion"
        ? 1000000000
        : unit && unit.toLowerCase() === "million"
          ? 1000000
          : unit && unit.toLowerCase() === "thousand"
            ? 1000
            : 1;
      return formatDollarAmount((base * multiplier) / 1000);
    });
  }

  function normalizeEnglishPerspective(value) {
    return String(value)
      .replace(/\bMy\b/g, "Your")
      .replace(/\bmy\b/g, "your");
  }

  function normalizeEnglishOptionText(value) {
    return normalizeEnglishPerspective(normalizeEnglishWonAmounts(value));
  }

  async function localizeOptions(rawOptions, category) {
    const groups = { en: {}, ko: {} };
    const localized = { en: {}, ko: {} };
    Object.entries(rawOptions).forEach(function ([key, value]) {
      const language = detectOptionLanguage(value);
      groups[language][key] = value;
      localized[language][key] = value;
    });

    const jobs = [];
    if (Object.keys(groups.en).length) {
      jobs.push({ from: "en", to: "ko", items: groups.en });
    }
    if (Object.keys(groups.ko).length) {
      jobs.push({ from: "ko", to: "en", items: groups.ko });
    }

    if (jobs.length) showToast(t("translating"));
    const results = await Promise.allSettled(jobs.map(function (job) {
      return translateItems(job.from, job.to, category, job.items).then(function (items) {
        return { job, items };
      });
    }));

    let failed = false;
    results.forEach(function (result) {
      if (result.status !== "fulfilled") {
        failed = true;
        return;
      }
      Object.entries(result.value.items).forEach(function ([key, value]) {
        if (typeof value === "string" && value.trim()) {
          localized[result.value.job.to][key] = value.trim();
        }
      });
    });
    if (failed) showToast(t("translateFailed"));

    return {
      a: {
        en: normalizeEnglishOptionText(localized.en.a || rawOptions.a),
        ko: localized.ko.a || rawOptions.a
      },
      b: {
        en: normalizeEnglishOptionText(localized.en.b || rawOptions.b),
        ko: localized.ko.b || rawOptions.b
      }
    };
  }

  async function customPayload(form) {
    const categoryId = String(form.get("category"));
    const category = categoryById(categoryId);
    const optionARaw = formText(form, "optionA");
    const optionBRaw = formText(form, "optionB");
    const durationMinutes = Number(form.get("duration"));
    if (!optionARaw || !optionBRaw || !durationMinutes) return null;
    const options = await localizeOptions({ a: optionARaw, b: optionBRaw }, category);

    return {
      slug: "custom-" + core.stableHash(options.a.en + options.b.en + Date.now()),
      title: options.a.en + " vs " + options.b.en,
      summary: category.en + " balance round",
      quorum: 1,
      closesInSeconds: Math.max(1, durationMinutes) * 60,
      prompt: {
        en: "Would you rather...",
        ko: "당신의 선택은?"
      },
      category,
      optionA: options.a,
      optionB: options.b
    };
  }

  function isClosed(proposal) {
    return proposal && Date.now() / 1000 >= proposal.closesAt;
  }

  function isVoteOpen(proposal) {
    return Boolean(proposal && !state.busy && !proposal.finalized && !isClosed(proposal) && (proposal.demo || proposal.encryptedStateChunks > 0));
  }

  function canTally(proposal) {
    return Boolean(state.wallet && proposal && !proposal.demo && !state.busy && !proposal.finalized && isClosed(proposal) && proposal.encryptedStateChunks > 0);
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
    const filters = state.categoryFilters;
    const proposals = state.proposals
      .filter(function (proposal) {
        return state.view === "new" ? !proposal.finalized && !isClosed(proposal) : proposal.finalized;
      })
      .sort(function (a, b) {
        if (state.view === "new") return b.createdAt - a.createdAt;
        return (b.closesAt || b.createdAt) - (a.closesAt || a.createdAt);
      });

    return proposals
      .filter(function (proposal) {
        return !filters.length || filters.includes(roundMeta(proposal).categoryId);
      })
      .map(function (proposal) {
        return { type: "proposal", id: proposal.proposal, proposal };
      });
  }

  function resultStats(proposal) {
    const result = {
      yes: proposal.yes,
      no: proposal.no,
      abstain: proposal.abstain,
      total: proposal.total
    };
    return {
      result,
      percentages: core.resultPercentages(result)
    };
  }

  function resultFooter(count, percent) {
    return count + " " + t("votesLabel") + " · " + percent + "%";
  }

  function visibleVoteCount(proposal) {
    return Math.max(Number(proposal.total) || 0, proposal.receipts.length);
  }

  function choiceCard(tone, label, body, footer, attributes) {
    const tag = attributes ? "button" : "div";
    const classes = "choice-button choice-button--" + tone + (attributes ? "" : " choice-button--static");
    const attrs = attributes ? ' type="button" ' + attributes : "";
    return [
      '<' + tag + ' class="' + classes + '"' + attrs + '>',
      '<span>' + escapeHtml(label) + '</span>',
      '<strong>' + escapeHtml(body) + '</strong>',
      footer ? '<em>' + escapeHtml(footer) + '</em>' : "",
      '</' + tag + '>'
    ].join("");
  }

  function choiceDivider(label) {
    return '<div class="choice-divider"><span>' + escapeHtml(label) + '</span></div>';
  }

  function categoryFilterLine() {
    const preferredOrder = ["hygiene", "daily", "food", "money", "powers", "absurd", "friends", "dating", "work"];
    const categories = Object.entries(bank.categories).sort(function ([a], [b]) {
      return preferredOrder.indexOf(a) - preferredOrder.indexOf(b);
    });
    const buttons = [['', t("allCategories")]].concat(categories.map(function ([id, category]) {
      return [id, text(category)];
    }));
    return [
      '<div class="category-filter-row" aria-label="Category filter">',
      buttons.map(function ([id, label]) {
        const active = id ? state.categoryFilters.includes(id) : state.categoryFilters.length === 0;
        return '<button type="button" data-category-filter="' + escapeHtml(id) + '"' + (active ? ' class="is-active"' : "") + '>' + escapeHtml(label) + '</button>';
      }).join(""),
      '</div>'
    ].join("");
  }

  function toggleCategoryFilter(categoryId) {
    if (!categoryId) {
      state.categoryFilters = [];
      return;
    }

    if (state.categoryFilters.includes(categoryId)) {
      state.categoryFilters = state.categoryFilters.filter(function (id) {
        return id !== categoryId;
      });
      return;
    }

    state.categoryFilters = state.categoryFilters.concat(categoryId);
  }

  function choiceStage(label, categoryId, categoryLabel, status) {
    return [
      '<div class="choice-stage">',
      '<div class="choice-headline">',
      '<button class="choice-meta choice-meta--category" type="button" data-category-filter="' + escapeHtml(categoryId) + '">' + escapeHtml(categoryLabel) + '</button>',
      choiceDivider(label),
      '<strong class="choice-meta choice-meta--status">' + escapeHtml(status) + '</strong>',
      '</div>',
      '</div>'
    ].join("");
  }

  function proposalCard(item, index) {
    const proposal = item.proposal;
    const meta = roundMeta(proposal);
    const disabled = !isVoteOpen(proposal) ? " disabled" : "";
    const proposalId = escapeHtml(proposal.proposal);
    const status = proposal.finalized ? t("final") : isClosed(proposal) ? t("ready") : t("sealed");
    const statusLine = status + " · " + formatStatus(proposal);
    const action = proposal.finalized
      ? (function () {
          const stats = resultStats(proposal);
          return [
            choiceStage(text(meta.prompt), meta.categoryId, text(meta.category), statusLine),
            '<div class="vote-actions vote-actions--result">',
            choiceCard("a", "A", text(meta.optionA), resultFooter(stats.result.yes, stats.percentages.yes)),
            choiceCard("b", "B", text(meta.optionB), resultFooter(stats.result.no, stats.percentages.no)),
            '</div>',
            '<div class="secondary-row">',
            '<span>' + escapeHtml(t("finalResult") + ' · ' + stats.result.total + ' ' + t("votesLabel") + ' · ' + t("skips") + ' ' + stats.result.abstain) + '</span>',
            '</div>'
          ].join("");
        })()
      : [
          choiceStage(text(meta.prompt), meta.categoryId, text(meta.category), statusLine),
          '<div class="vote-actions">',
          choiceCard("a", "A", text(meta.optionA), t("voteA"), 'data-vote-proposal="' + proposalId + '" data-choice="yes"' + disabled),
          choiceCard("b", "B", text(meta.optionB), t("voteB"), 'data-vote-proposal="' + proposalId + '" data-choice="no"' + disabled),
          '</div>',
          '<div class="secondary-row">',
          '<button type="button" data-skip-proposal="' + proposalId + '"' + disabled + '>' + escapeHtml(t("skip")) + '</button>',
          isClosed(proposal) && !proposal.finalized
            ? '<button type="button" data-reveal-proposal="' + proposalId + '">' + escapeHtml(t("reveal")) + '</button>'
            : '<span>' + visibleVoteCount(proposal) + ' ' + escapeHtml(t("votesLabel")) + '</span>',
          '</div>'
        ].join("");

    return [
      '<article class="vote-card" data-card-index="' + index + '">',
      categoryFilterLine(),
      '<div class="card-main">',
      action,
      '</div>',
      '</article>'
    ].join("");
  }

  function emptyCard() {
    return [
      '<article class="vote-card vote-card--empty">',
      categoryFilterLine(),
      '<div class="card-main">',
      '<div class="question-copy">',
      '<span>' + escapeHtml(t("sealedTitle")) + '</span>',
      '<h1>' + escapeHtml(t("noRounds")) + '</h1>',
      '<p>' + escapeHtml(t("noRoundsBody")) + '</p>',
      '</div>',
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
      return proposalCard(item, index);
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
    els.topbarNewVote.hidden = !state.wallet;
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
    els.profileConnect.querySelector("span").textContent = state.wallet ? t("connectedWalletAction") : t("connectWalletAction");
    els.profileConnect.disabled = Boolean(state.wallet);
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
    if (behavior === "auto") {
      els.voteFeed.classList.add("is-jump");
    }
    els.voteFeed.style.transform = "translate3d(0, -" + (nextIndex * 100) + "%, 0)";
    if (behavior === "auto") {
      requestAnimationFrame(function () {
        els.voteFeed.classList.remove("is-jump");
      });
    }
  }

  function navigateBy(direction, fromIndex, cooldown) {
    if (state.view === "profile" || direction === 0 || Date.now() < state.scrollCooldownUntil) return false;
    state.scrollCooldownUntil = Date.now() + (cooldown || 100);
    scrollToIndex((fromIndex ?? state.activeIndex) + Math.sign(direction));
    return true;
  }

  function unlockWheelGesture() {
    state.wheelGestureLocked = false;
    state.wheelDelta = 0;
    window.clearTimeout(state.wheelIdleTimer);
    window.clearTimeout(state.wheelFallbackTimer);
    state.wheelIdleTimer = 0;
    state.wheelFallbackTimer = 0;
  }

  function scheduleWheelUnlock() {
    window.clearTimeout(state.wheelIdleTimer);
    window.clearTimeout(state.wheelFallbackTimer);
    state.wheelIdleTimer = window.setTimeout(unlockWheelGesture, 520);
    state.wheelFallbackTimer = window.setTimeout(unlockWheelGesture, 1800);
  }

  function wheelCardIndex(event) {
    const card = event.target.closest && event.target.closest(".vote-card");
    if (!card) return state.activeIndex;
    return Number(card.getAttribute("data-card-index"));
  }

  function handleWheel(event) {
    if (state.view === "profile") return;
    const deltaX = event.deltaX || 0;
    const deltaY = event.deltaY || 0;
    if (Math.abs(deltaY) <= Math.abs(deltaX) || Math.abs(deltaY) < 1) return;
    event.preventDefault();

    if (wheelCardIndex(event) !== state.activeIndex) {
      scheduleWheelUnlock();
      return;
    }

    if (state.wheelGestureLocked) {
      scheduleWheelUnlock();
      return;
    }

    state.wheelDelta = Math.sign(state.wheelDelta) === Math.sign(deltaY)
      ? state.wheelDelta + deltaY
      : deltaY;
    if (Math.abs(state.wheelDelta) < 28) return;

    if (navigateBy(state.wheelDelta > 0 ? 1 : -1)) {
      state.wheelGestureLocked = true;
      state.wheelDelta = 0;
      scheduleWheelUnlock();
    }
  }

  function resetScrollGuards() {
    state.scrollCooldownUntil = 0;
    unlockWheelGesture();
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

  function handleCategoryPointerDown(event) {
    const row = event.target.closest && event.target.closest(".category-filter-row");
    if (!row) return;
    state.categoryDrag = {
      row,
      pointerId: event.pointerId,
      startX: event.clientX,
      scrollLeft: row.scrollLeft,
      moved: false,
      captured: false
    };
  }

  function handleCategoryPointerMove(event) {
    const drag = state.categoryDrag;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.startX;
    if (Math.abs(dx) > 8) {
      drag.moved = true;
      state.categoryDragSuppressClick = true;
      drag.row.classList.add("is-dragging");
      if (!drag.captured && drag.row.setPointerCapture) {
        drag.row.setPointerCapture(event.pointerId);
        drag.captured = true;
      }
    }
    if (drag.moved) {
      drag.row.scrollLeft = drag.scrollLeft - dx;
      event.preventDefault();
    }
  }

  function handleCategoryPointerUp(event) {
    const drag = state.categoryDrag;
    if (!drag || drag.pointerId !== event.pointerId) return;
    drag.row.classList.remove("is-dragging");
    if (drag.captured && drag.row.releasePointerCapture) {
      drag.row.releasePointerCapture(event.pointerId);
    }
    state.categoryDrag = null;
    if (drag.moved) {
      window.setTimeout(function () {
        state.categoryDragSuppressClick = false;
      }, 120);
    } else {
      state.categoryDragSuppressClick = false;
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
      images: prepared.images,
      initComputationOffset: prepared.initComputationOffset,
      signature
    });
    state.view = "hot";
    state.activeIndex = 0;
    await refresh({ silent: true });
    showToast(t("roundReady"));
    return data;
  }

  function seededRoundPayload(proposal) {
    const meta = roundMeta(proposal);
    const optionA = meta.optionA;
    const optionB = meta.optionB;
    const category = meta.category;
    const now = Math.floor(Date.now() / 1000);
    const remaining = Math.max(45, Math.min(7 * 24 * 60 * 60, Math.floor((proposal.closesAt || now + 7 * 24 * 60 * 60) - now)));

    return {
      slug: proposal.slug,
      title: englishText(optionA, text(optionA)) + " vs " + englishText(optionB, text(optionB)),
      summary: englishText(category, "Community") + " weekly broadcast round",
      quorum: proposal.quorum || 1,
      closesInSeconds: remaining,
      prompt: meta.prompt,
      category,
      optionA,
      optionB,
      images: proposal.images
    };
  }

  async function materializeSeedProposal(proposal, wallet) {
    if (!proposal.demo) return proposal;

    showToast(t("launchingSeed"));
    const prepared = await postJson("/api/wallet/proposal-tx", {
      publicKey: wallet,
      ...seededRoundPayload(proposal)
    });
    showToast(t("approveRound"));
    const signature = await signAndSend(prepared.transaction.transaction);
    showToast(t("waitingInit"));
    const confirmed = await postJson("/api/wallet/proposal-confirm", {
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
      images: prepared.images,
      initComputationOffset: prepared.initComputationOffset,
      signature
    });

    await refresh({ silent: true });
    if (
      confirmed.transactions && confirmed.transactions.finalizationStatus === "pending"
      || !confirmed.proposal
      || confirmed.proposal.encryptedStateChunks === 0
      || confirmed.proposal.stateNonce === "0"
    ) {
      showToast(t("seedPending"));
      return null;
    }
    showToast(t("roundReady"));
    return confirmed.proposal;
  }

  async function submitVote(choice, proposalKey) {
    let proposal = state.proposals.find(function (item) {
      return item.proposal === proposalKey;
    });
    if (!proposal || !isVoteOpen(proposal)) return;

    try {
      const wallet = await ensureWallet();
      if (!wallet) return;
      if (!window.CipherDaoCrypto) throw new Error("Arcium browser crypto bundle did not load");
      state.busy = true;
      render();
      proposal = await materializeSeedProposal(proposal, wallet);
      if (!proposal) return;
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
      const confirmed = await postJson("/api/wallet/vote-confirm", {
        publicKey: wallet,
        proposal: proposal.proposal,
        computationOffset: prepared.computationOffset,
        signature
      });
      await refresh({ silent: true });
      showToast(confirmed.transactions && confirmed.transactions.finalizationStatus === "pending"
        ? t("voteQueued")
        : t("voteFinalized"));
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
      const confirmed = await postJson("/api/wallet/tally-confirm", {
        publicKey: wallet,
        proposal: proposal.proposal,
        computationOffset: prepared.computationOffset,
        signature
      });
      await refresh({ silent: true });
      showToast(confirmed.transactions && confirmed.transactions.finalizationStatus === "pending"
        ? t("resultQueued")
        : t("resultPublished"));
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
  els.voteFeed.addEventListener("pointerdown", handleCategoryPointerDown);
  els.voteFeed.addEventListener("pointermove", handleCategoryPointerMove);
  els.voteFeed.addEventListener("pointerup", handleCategoryPointerUp);
  els.voteFeed.addEventListener("pointercancel", handleCategoryPointerUp);
  window.addEventListener("keydown", handleKeyDown);

  els.voteFeed.addEventListener("click", async function (event) {
    const categoryButton = event.target.closest("[data-category-filter]");
    const voteButton = event.target.closest("[data-vote-proposal]");
    const skipButton = event.target.closest("[data-skip-proposal]");
    const revealButton = event.target.closest("[data-reveal-proposal]");

    if (categoryButton) {
      if (state.categoryDragSuppressClick) return;
      toggleCategoryFilter(categoryButton.getAttribute("data-category-filter"));
      resetScrollGuards();
      render();
      return;
    }
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
  });

  els.openDialog.addEventListener("click", function () {
    els.dialog.showModal();
  });

  els.topbarNewVote.addEventListener("click", function () {
    els.dialog.showModal();
  });

  els.aboutOpen.addEventListener("click", function () {
    els.aboutDialog.showModal();
  });

  els.closeAbout.addEventListener("click", function () {
    els.aboutDialog.close();
  });

  els.closeDialog.addEventListener("click", function () {
    els.dialog.close();
  });

  els.createForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    const payload = await customPayload(new FormData(els.createForm));
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
