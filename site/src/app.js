(function () {
  const core = window.GovernanceCore;
  const state = {
    config: null,
    proposals: [],
    selectedProposalId: null,
    selectedChoice: "yes",
    busy: false,
    loading: true
  };

  const els = {
    walletButton: document.querySelector("[data-connect]"),
    clusterLabel: document.querySelector("[data-cluster-label]"),
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

  function selectedProposal() {
    return state.proposals.find(function (proposal) {
      return proposal.proposal === state.selectedProposalId;
    }) || state.proposals[0] || null;
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
      if (!state.selectedProposalId && state.proposals.length > 0) {
        state.selectedProposalId = state.proposals[0].proposal;
      }
      if (state.selectedProposalId && !state.proposals.some(function (proposal) {
        return proposal.proposal === state.selectedProposalId;
      })) {
        state.selectedProposalId = state.proposals[0] ? state.proposals[0].proposal : null;
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

  function short(value) {
    if (!value) return "";
    return value.slice(0, 6) + "..." + value.slice(-6);
  }

  function explorerTx(signature) {
    return "https://explorer.solana.com/tx/" + signature + "?cluster=devnet";
  }

  function formatClose(proposal) {
    if (!proposal) return "Loading";
    if (proposal.finalized) return "Finalized";
    const diff = Math.ceil(proposal.closesAt - Date.now() / 1000);
    if (diff <= 0) return "Ready to tally";
    if (diff < 60) return diff + "s remaining";
    if (diff < 3600) return Math.ceil(diff / 60) + "m remaining";
    if (diff < 86400) return Math.ceil(diff / 3600) + "h remaining";
    return Math.ceil(diff / 86400) + "d remaining";
  }

  function isClosed(proposal) {
    return proposal && Date.now() / 1000 >= proposal.closesAt;
  }

  function canVote(proposal) {
    return proposal && !state.busy && !proposal.finalized && !isClosed(proposal) && proposal.encryptedStateChunks > 0;
  }

  function canTally(proposal) {
    return proposal && !state.busy && !proposal.finalized && isClosed(proposal) && proposal.encryptedStateChunks > 0;
  }

  function titleCase(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
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

  function renderEmpty() {
    els.walletButton.querySelector("span").textContent = state.busy ? "Working" : "Relayer";
    els.proposalTitle.textContent = state.loading ? "Loading devnet proposals" : "No proposals";
    els.proposalSummary.textContent = state.loading ? "Fetching current on-chain state." : "Create a proposal to start private voting.";
    els.closeLabel.textContent = "Idle";
    els.receiptCount.textContent = "0";
    els.quorumValue.textContent = "0";
    els.privacyState.textContent = "Ready";
    els.proposalList.innerHTML = "";
    els.voteOptions.innerHTML = "";
    els.receipts.innerHTML = "";
    els.tally.innerHTML = '<div class="sealed-tally"><strong>No on-chain proposal selected</strong></div>';
    els.proof.textContent = "Waiting";
    els.proofState.textContent = "Relayer idle";
    els.castButton.disabled = true;
    els.finalizeButton.disabled = true;
  }

  function render() {
    const proposal = selectedProposal();
    if (!proposal) {
      renderEmpty();
      return;
    }

    const result = {
      yes: proposal.yes,
      no: proposal.no,
      abstain: proposal.abstain,
      total: proposal.total
    };
    const percentages = proposal.finalized ? core.resultPercentages(result) : null;

    els.clusterLabel.textContent = state.config ? "Solana devnet" : "Connecting";
    els.walletButton.querySelector("span").textContent = state.busy ? "Working" : "Relayer";
    els.proposalTitle.textContent = proposal.title;
    els.proposalSummary.textContent = proposal.summary;
    els.closeLabel.textContent = formatClose(proposal);
    els.receiptCount.textContent = String(proposal.receipts.length);
    els.quorumValue.textContent = String(proposal.quorum);
    els.privacyState.textContent = proposal.finalized ? "Public result" : "Sealed";
    els.castButton.disabled = !canVote(proposal);
    els.finalizeButton.disabled = !canTally(proposal);

    els.proposalList.innerHTML = state.proposals.map(function (item) {
      const active = item.proposal === proposal.proposal ? " is-active" : "";
      const status = item.finalized ? "Finalized" : isClosed(item) ? "Tally" : "Open";
      return [
        '<button class="proposal-item' + active + '" data-select-proposal="' + item.proposal + '">',
        '<span class="proposal-item__top">',
        '<strong>' + escapeHtml(item.title) + '</strong>',
        '<span>' + status + '</span>',
        '</span>',
        '<span class="proposal-item__meta">' + item.receipts.length + " encrypted receipts</span>",
        '<code class="proposal-item__signature">' + short(item.proposal) + '</code>',
        '</button>'
      ].join("");
    }).join("");

    els.voteOptions.innerHTML = core.CHOICES.map(function (choice) {
      const checked = state.selectedChoice === choice ? " checked" : "";
      const disabled = !canVote(proposal) ? " disabled" : "";
      return [
        '<label class="choice">',
        '<input type="radio" name="choice" value="' + choice + '"' + checked + disabled + '>',
        '<span>' + titleCase(choice) + '</span>',
        '</label>'
      ].join("");
    }).join("");

    if (proposal.receipts.length === 0) {
      els.receipts.innerHTML = '<li><span>No encrypted receipts yet</span><code>' + short(proposal.proposal) + '</code></li>';
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
        tallyRow("Yes", result.yes, percentages.yes, "yes"),
        tallyRow("No", result.no, percentages.no, "no"),
        tallyRow("Abstain", result.abstain, percentages.abstain, "abstain")
      ].join("");
      els.proof.textContent = proposal.tallyFinalizeSignature ? short(proposal.tallyFinalizeSignature) : short(proposal.proposal);
      els.proofState.textContent = "Verified callback output";
    } else {
      els.tally.innerHTML = [
        '<div class="sealed-tally">',
        '<strong>Interim tally sealed</strong>',
        '<span>' + proposal.encryptedStateChunks + " encrypted state chunks on devnet</span>",
        '</div>'
      ].join("");
      els.proof.textContent = proposal.stateNonce === "0" ? "Initializing state" : short(proposal.stateNonce);
      els.proofState.textContent = isClosed(proposal) ? "Ready to publish" : "MPC execution pending";
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

    document.querySelectorAll('input[name="choice"]').forEach(function (input) {
      input.addEventListener("change", function () {
        state.selectedChoice = input.value;
      });
    });
  }

  els.walletButton.addEventListener("click", function () {
    if (!state.config) {
      refresh();
      return;
    }
    showToast("Relayer " + short(state.config.relayer) + " ready");
  });

  els.castButton.addEventListener("click", async function () {
    const proposal = selectedProposal();
    if (!proposal || !canVote(proposal)) return;
    try {
      setBusy(true, "Submitting encrypted vote");
      await postJson("/api/vote", {
        proposal: proposal.proposal,
        choice: state.selectedChoice
      });
      await refresh({ silent: true });
      showToast("Encrypted vote finalized");
    } catch (error) {
      showToast(error.message);
    } finally {
      setBusy(false);
    }
  });

  els.finalizeButton.addEventListener("click", async function () {
    const proposal = selectedProposal();
    if (!proposal || !canTally(proposal)) return;
    try {
      setBusy(true, "Publishing private tally");
      await postJson("/api/tally", {
        proposal: proposal.proposal
      });
      await refresh({ silent: true });
      showToast("Final tally published");
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
    const form = new FormData(els.createForm);
    const title = String(form.get("title")).trim();
    const summary = String(form.get("summary")).trim();
    const quorum = Number(form.get("quorum"));
    const durationMinutes = Number(form.get("duration"));
    if (!title || !summary || !quorum || !durationMinutes) {
      showToast("Fill every proposal field");
      return;
    }

    try {
      els.dialog.close();
      setBusy(true, "Creating devnet proposal");
      const data = await postJson("/api/proposals", {
        title: title,
        summary: summary,
        quorum: quorum,
        closesInSeconds: durationMinutes * 60
      });
      state.selectedProposalId = data.proposal.proposal;
      els.createForm.reset();
      await refresh({ silent: true });
      showToast("Proposal initialized on devnet");
    } catch (error) {
      showToast(error.message);
    } finally {
      setBusy(false);
    }
  });

  window.setInterval(function () {
    if (!state.busy) render();
  }, 1000);

  window.setInterval(function () {
    if (!state.busy) refresh({ silent: true });
  }, 15000);

  refresh();
})();
