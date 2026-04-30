(function () {
  const core = window.GovernanceCore;
  const state = {
    wallet: null,
    selectedProposalId: "treasury-privacy-grants",
    selectedChoice: "yes",
    toast: "",
    proposals: [
      {
        id: "treasury-privacy-grants",
        title: "Fund confidential governance grants",
        summary: "Allocate 15,000 USDC from the treasury to privacy-first DAO tooling.",
        quorum: 7,
        closesLabel: "21h remaining",
        finalized: false,
        receipts: seedReceipts("treasury-privacy-grants", ["yes", "no", "yes"]),
        result: null,
        proof: null
      },
      {
        id: "validator-delegation",
        title: "Delegate stake to privacy validators",
        summary: "Move 8 percent of treasury SOL into validators that operate Arcium infrastructure.",
        quorum: 6,
        closesLabel: "2d remaining",
        finalized: false,
        receipts: seedReceipts("validator-delegation", ["abstain", "yes"]),
        result: null,
        proof: null
      },
      {
        id: "retro-funding",
        title: "Approve retroactive builder rewards",
        summary: "Reward contributors who shipped open-source governance analytics.",
        quorum: 4,
        closesLabel: "Finalized",
        finalized: true,
        receipts: seedReceipts("retro-funding", ["yes", "yes", "no", "abstain", "yes"]),
        result: null,
        proof: null
      }
    ]
  };

  state.proposals.forEach(function (proposal) {
    if (proposal.finalized) {
      proposal.result = core.tallyVotes(proposal.receipts);
      proposal.proof = core.createProofId(proposal.id, proposal.receipts, proposal.result);
    }
  });

  const els = {
    walletButton: document.querySelector("[data-connect]"),
    proposalList: document.querySelector("[data-proposal-list]"),
    proposalTitle: document.querySelector("[data-proposal-title]"),
    proposalSummary: document.querySelector("[data-proposal-summary]"),
    closeLabel: document.querySelector("[data-close-label]"),
    receiptCount: document.querySelector("[data-receipt-count]"),
    quorumValue: document.querySelector("[data-quorum]"),
    privacyState: document.querySelector("[data-privacy-state]"),
    voteOptions: document.querySelector("[data-vote-options]"),
    castButton: document.querySelector("[data-cast-vote]"),
    finalizeButton: document.querySelector("[data-finalize]"),
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

  function seedReceipts(proposalId, choices) {
    return choices.map(function (choice, index) {
      return core.makeEncryptedReceipt({
        proposalId: proposalId,
        wallet: "seed_wallet_" + index,
        choice: choice,
        round: index
      });
    });
  }

  function selectedProposal() {
    return state.proposals.find(function (proposal) {
      return proposal.id === state.selectedProposalId;
    });
  }

  function formatWallet(wallet) {
    if (!wallet) {
      return "Connect";
    }
    return wallet.slice(0, 4) + "..." + wallet.slice(-4);
  }

  function showToast(message) {
    state.toast = message;
    els.toast.textContent = message;
    els.toast.classList.add("is-visible");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(function () {
      els.toast.classList.remove("is-visible");
    }, 2600);
  }

  function render() {
    const proposal = selectedProposal();
    const percentages = proposal.result ? core.resultPercentages(proposal.result) : null;

    els.walletButton.querySelector("span").textContent = formatWallet(state.wallet);
    els.proposalTitle.textContent = proposal.title;
    els.proposalSummary.textContent = proposal.summary;
    els.closeLabel.textContent = proposal.finalized ? "Finalized" : proposal.closesLabel;
    els.receiptCount.textContent = String(proposal.receipts.length);
    els.quorumValue.textContent = String(proposal.quorum);
    els.privacyState.textContent = proposal.finalized ? "Public result" : "Sealed";
    els.castButton.disabled = proposal.finalized;
    els.finalizeButton.disabled = proposal.finalized || proposal.receipts.length === 0;

    els.proposalList.innerHTML = state.proposals.map(function (item) {
      const active = item.id === proposal.id ? " is-active" : "";
      const status = item.finalized ? "Finalized" : "Open";
      return [
        '<button class="proposal-item' + active + '" data-select-proposal="' + item.id + '">',
        '<span class="proposal-item__top">',
        '<strong>' + escapeHtml(item.title) + '</strong>',
        '<span>' + status + '</span>',
        '</span>',
        '<span class="proposal-item__meta">' + item.receipts.length + " encrypted receipts</span>",
        '</button>'
      ].join("");
    }).join("");

    els.voteOptions.innerHTML = core.CHOICES.map(function (choice) {
      const checked = state.selectedChoice === choice ? " checked" : "";
      const disabled = proposal.finalized ? " disabled" : "";
      return [
        '<label class="choice">',
        '<input type="radio" name="choice" value="' + choice + '"' + checked + disabled + '>',
        '<span>' + titleCase(choice) + '</span>',
        '</label>'
      ].join("");
    }).join("");

    els.receipts.innerHTML = proposal.receipts.slice().reverse().map(function (receipt) {
      return [
        '<li>',
        '<span>' + receipt.ciphertext + '</span>',
        '<code>' + receipt.commitment + '</code>',
        '</li>'
      ].join("");
    }).join("");

    if (proposal.result) {
      els.tally.innerHTML = [
        tallyRow("Yes", proposal.result.yes, percentages.yes, "yes"),
        tallyRow("No", proposal.result.no, percentages.no, "no"),
        tallyRow("Abstain", proposal.result.abstain, percentages.abstain, "abstain")
      ].join("");
      els.proof.textContent = proposal.proof;
      els.proofState.textContent = "Verified callback output";
    } else {
      els.tally.innerHTML = [
        '<div class="sealed-tally">',
        '<strong>Interim tally sealed</strong>',
        '<span>Only encrypted receipts are visible before finalization.</span>',
        '</div>'
      ].join("");
      els.proof.textContent = "Waiting for finalization";
      els.proofState.textContent = "MPC execution pending";
    }

    bindDynamicEvents();
  }

  function tallyRow(label, count, percent, tone) {
    return [
      '<div class="tally-row tally-row--' + tone + '">',
      '<span>' + label + '</span>',
      '<div class="tally-bar"><i style="width:' + percent + '%"></i></div>',
      '<strong>' + count + '</strong>',
      '</div>'
    ].join("");
  }

  function bindDynamicEvents() {
    document.querySelectorAll("[data-select-proposal]").forEach(function (button) {
      button.addEventListener("click", function () {
        state.selectedProposalId = button.getAttribute("data-select-proposal");
        render();
      });
    });

    document.querySelectorAll('input[name="choice"]').forEach(function (input) {
      input.addEventListener("change", function () {
        state.selectedChoice = input.value;
      });
    });
  }

  function titleCase(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  function escapeHtml(value) {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  els.walletButton.addEventListener("click", async function () {
    try {
      if (window.solana && window.solana.isPhantom) {
        const response = await window.solana.connect();
        state.wallet = response.publicKey.toString();
        render();
        showToast("Wallet connected");
        return;
      }
    } catch (error) {
      showToast("Wallet connection rejected");
      return;
    }

    state.wallet = state.wallet || "9nYk7pQ2CipherDemo42";
    render();
    showToast("Demo wallet connected");
  });

  els.castButton.addEventListener("click", function () {
    const proposal = selectedProposal();
    if (!state.wallet) {
      showToast("Connect a wallet first");
      return;
    }
    if (proposal.finalized) {
      showToast("This proposal is finalized");
      return;
    }
    const receipt = core.makeEncryptedReceipt({
      proposalId: proposal.id,
      wallet: state.wallet,
      choice: state.selectedChoice,
      round: proposal.receipts.length
    });
    proposal.receipts.push(receipt);
    render();
    showToast("Encrypted vote queued");
  });

  els.finalizeButton.addEventListener("click", function () {
    const proposal = selectedProposal();
    proposal.result = core.tallyVotes(proposal.receipts);
    proposal.proof = core.createProofId(proposal.id, proposal.receipts, proposal.result);
    proposal.finalized = true;
    proposal.closesLabel = "Finalized";
    render();
    showToast("Final tally published");
  });

  els.openDialog.addEventListener("click", function () {
    els.dialog.showModal();
  });

  els.closeDialog.addEventListener("click", function () {
    els.dialog.close();
  });

  els.createForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const form = new FormData(els.createForm);
    const title = String(form.get("title")).trim();
    const summary = String(form.get("summary")).trim();
    const quorum = Number(form.get("quorum"));
    if (!title || !summary || !quorum) {
      showToast("Fill every proposal field");
      return;
    }
    const id = core.stableHash(title + ":" + Date.now());
    state.proposals.unshift({
      id: id,
      title: title,
      summary: summary,
      quorum: quorum,
      closesLabel: "3d remaining",
      finalized: false,
      receipts: [],
      result: null,
      proof: null
    });
    state.selectedProposalId = id;
    els.createForm.reset();
    els.dialog.close();
    render();
    showToast("Proposal created");
  });

  render();
})();
