/* ===== SOLITAIRE APP (Klondike) =====
   Click-based controls (no drag-and-drop, to keep this reliable):
   1. Click a face-up card to select it (and everything stacked on top of it).
   2. Click a destination pile (another tableau column, or a foundation) to move there.
   3. Double-click a top card to try auto-sending it to its foundation.
   4. Click the stock pile to draw a card to the waste pile.
   Click the stock again when empty to recycle the waste back into it.
*/

window.WebzApps = window.WebzApps || {};

const SUITS = ["S", "H", "D", "C"];
const SUIT_SYMBOL = { S: "♠", H: "♥", D: "♦", C: "♣" };

function suitIsRed(suit) {
  return suit === "H" || suit === "D";
}
function rankLabel(rank) {
  if (rank === 1) return "A";
  if (rank === 11) return "J";
  if (rank === 12) return "Q";
  if (rank === 13) return "K";
  return String(rank);
}

window.WebzApps.solitaire = {
  title: "Solitaire",
  icon: "🃏",
  open() {
    const wrapper = document.createElement("div");
    wrapper.style.height = "100%";
    wrapper.style.display = "flex";
    wrapper.style.flexDirection = "column";
    wrapper.style.background = "#0a6e0a";
    wrapper.style.padding = "8px";
    wrapper.style.fontFamily = "'Tahoma', sans-serif";
    wrapper.style.userSelect = "none";

    wrapper.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
        <button id="sol-new">🔄 New Game</button>
        <div id="sol-message" style="color:white; font-weight:bold;"></div>
      </div>
      <div id="sol-top-row" style="display:flex; gap:8px; margin-bottom:16px;"></div>
      <div id="sol-tableau-row" style="display:flex; gap:8px; flex:1;"></div>
    `;

    WebzWM.createWindow({
      title: "Solitaire",
      icon: "🃏",
      width: 620,
      height: 520,
      content: wrapper,
      onMount: (body) => initSolitaire(body),
    });
  },
};

function initSolitaire(body) {
  const topRow = body.querySelector("#sol-top-row");
  const tableauRow = body.querySelector("#sol-tableau-row");
  const newGameBtn = body.querySelector("#sol-new");
  const messageEl = body.querySelector("#sol-message");

  const CARD_W = 56, CARD_H = 78, OVERLAP = 20;

  let stock, waste, foundations, tableau, selection;

  function buildDeck() {
    const deck = [];
    SUITS.forEach((suit) => {
      for (let rank = 1; rank <= 13; rank++) {
        deck.push({ suit, rank, faceUp: false });
      }
    });
    return deck;
  }

  function shuffle(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }

  function newGame() {
    const deck = shuffle(buildDeck());
    tableau = [[], [], [], [], [], [], []];
    for (let col = 0; col < 7; col++) {
      for (let row = 0; row <= col; row++) {
        const card = deck.pop();
        card.faceUp = row === col;
        tableau[col].push(card);
      }
    }
    stock = deck; // remaining 24 cards, face down
    waste = [];
    foundations = { S: [], H: [], D: [], C: [] };
    selection = null;
    messageEl.textContent = "";
    render();
  }

  function cardLabel(card) {
    return `${rankLabel(card.rank)}${SUIT_SYMBOL[card.suit]}`;
  }

  function makeCardEl(card, faceUp, selected) {
    const el = document.createElement("div");
    el.style.width = CARD_W + "px";
    el.style.height = CARD_H + "px";
    el.style.borderRadius = "4px";
    el.style.display = "flex";
    el.style.alignItems = "center";
    el.style.justifyContent = "center";
    el.style.fontWeight = "bold";
    el.style.fontSize = "16px";
    el.style.cursor = "pointer";
    el.style.boxShadow = "1px 1px 3px rgba(0,0,0,0.5)";

    if (faceUp) {
      el.style.background = "white";
      el.style.border = selected ? "2px solid #ffd500" : "1px solid #333";
      el.style.color = suitIsRed(card.suit) ? "#c00000" : "#000";
      el.textContent = cardLabel(card);
    } else {
      el.style.background = "repeating-linear-gradient(45deg, #1a3fa0, #1a3fa0 4px, #2a55c0 4px, #2a55c0 8px)";
      el.style.border = "1px solid #05205a";
    }
    return el;
  }

  function makeEmptySlotEl(hint) {
    const el = document.createElement("div");
    el.style.width = CARD_W + "px";
    el.style.height = CARD_H + "px";
    el.style.border = "2px dashed rgba(255,255,255,0.6)";
    el.style.borderRadius = "4px";
    el.style.display = "flex";
    el.style.alignItems = "center";
    el.style.justifyContent = "center";
    el.style.color = "rgba(255,255,255,0.7)";
    el.style.fontSize = "20px";
    el.textContent = hint || "";
    return el;
  }

  // ---- Rendering ----
  function render() {
    renderTopRow();
    renderTableau();
    checkWin();
  }

  function renderTopRow() {
    topRow.innerHTML = "";

    // Stock
    const stockSlot = document.createElement("div");
    stockSlot.style.cursor = "pointer";
    if (stock.length > 0) {
      stockSlot.appendChild(makeCardEl(null, false, false));
    } else {
      stockSlot.appendChild(makeEmptySlotEl("↺"));
    }
    stockSlot.addEventListener("click", onStockClick);
    topRow.appendChild(stockSlot);

    // Waste
    const wasteSlot = document.createElement("div");
    if (waste.length > 0) {
      const topCard = waste[waste.length - 1];
      const isSelected = selection && selection.source === "waste";
      const cardEl = makeCardEl(topCard, true, isSelected);
      cardEl.addEventListener("click", () => onWasteCardClick());
      cardEl.addEventListener("dblclick", () => tryAutoFoundation("waste", null));
      wasteSlot.appendChild(cardEl);
    } else {
      wasteSlot.appendChild(makeEmptySlotEl());
    }
    topRow.appendChild(wasteSlot);

    // Spacer
    const spacer = document.createElement("div");
    spacer.style.flex = "1";
    topRow.appendChild(spacer);

    // Foundations
    SUITS.forEach((suit) => {
      const pile = foundations[suit];
      const slot = document.createElement("div");
      if (pile.length > 0) {
        const topCard = pile[pile.length - 1];
        const cardEl = makeCardEl(topCard, true, false);
        cardEl.addEventListener("click", () => onFoundationClick(suit));
        slot.appendChild(cardEl);
      } else {
        const emptyEl = makeEmptySlotEl(SUIT_SYMBOL[suit]);
        emptyEl.style.color = suitIsRed(suit) ? "rgba(255,150,150,0.8)" : "rgba(255,255,255,0.8)";
        emptyEl.addEventListener("click", () => onFoundationClick(suit));
        slot.appendChild(emptyEl);
      }
      topRow.appendChild(slot);
    });
  }

  function renderTableau() {
    tableauRow.innerHTML = "";
    tableau.forEach((pile, colIndex) => {
      const colEl = document.createElement("div");
      colEl.style.position = "relative";
      colEl.style.width = CARD_W + "px";
      colEl.style.flex = "1";
      colEl.style.minWidth = CARD_W + "px";

      if (pile.length === 0) {
        const emptyEl = makeEmptySlotEl();
        emptyEl.style.position = "absolute";
        emptyEl.style.top = "0";
        emptyEl.addEventListener("click", () => onTableauEmptyClick(colIndex));
        colEl.appendChild(emptyEl);
      }

      pile.forEach((card, cardIndex) => {
        const isSelected =
          selection &&
          selection.source === "tableau" &&
          selection.pileIndex === colIndex &&
          cardIndex >= selection.cardIndex;

        const cardEl = makeCardEl(card, card.faceUp, isSelected);
        cardEl.style.position = "absolute";
        cardEl.style.top = cardIndex * OVERLAP + "px";
        cardEl.style.zIndex = cardIndex;

        if (card.faceUp) {
          cardEl.addEventListener("click", (e) => {
            e.stopPropagation();
            onTableauCardClick(colIndex, cardIndex);
          });
          cardEl.addEventListener("dblclick", (e) => {
            e.stopPropagation();
            if (cardIndex === pile.length - 1) tryAutoFoundation("tableau", colIndex);
          });
        }
        colEl.appendChild(cardEl);
      });

      // Click on empty area below the stack also counts as "click this pile"
      colEl.addEventListener("click", () => {
        if (pile.length === 0) onTableauEmptyClick(colIndex);
        else attemptMoveToTableau(colIndex);
      });

      tableauRow.appendChild(colEl);
    });
  }

  // ---- Interactions ----
  function onStockClick() {
    if (stock.length > 0) {
      const card = stock.pop();
      card.faceUp = true;
      waste.push(card);
    } else if (waste.length > 0) {
      // Recycle waste back into stock, face down
      while (waste.length > 0) {
        const card = waste.pop();
        card.faceUp = false;
        stock.push(card);
      }
    }
    selection = null;
    render();
  }

  function onWasteCardClick() {
    if (selection && selection.source === "waste") {
      selection = null;
    } else {
      selection = { source: "waste" };
    }
    render();
  }

  function onTableauCardClick(colIndex, cardIndex) {
    const pile = tableau[colIndex];
    const card = pile[cardIndex];
    if (!card.faceUp) return;

    // If there's already a selection, try to move it onto this column instead of selecting
    if (selection) {
      // Clicking the exact same selection again deselects
      if (selection.source === "tableau" && selection.pileIndex === colIndex && selection.cardIndex === cardIndex) {
        selection = null;
        render();
        return;
      }
      attemptMoveToTableau(colIndex);
      return;
    }

    selection = { source: "tableau", pileIndex: colIndex, cardIndex };
    render();
  }

  function onTableauEmptyClick(colIndex) {
    if (selection) {
      attemptMoveToTableau(colIndex);
    }
  }

  function onFoundationClick(suit) {
    if (!selection) return;

    const movingCard = getSelectedCards()[0];
    const cards = getSelectedCards();
    if (cards.length !== 1) {
      messageEl.textContent = "Only one card at a time can go to a foundation.";
      return;
    }
    if (movingCard.suit !== suit) {
      messageEl.textContent = "That card doesn't belong on that foundation.";
      return;
    }
    if (canPlaceOnFoundation(movingCard, suit)) {
      removeSelectedCards();
      foundations[suit].push(movingCard);
      flipNewTopCardIfNeeded();
      selection = null;
      messageEl.textContent = "";
      render();
    } else {
      messageEl.textContent = "That card can't go there yet.";
    }
  }

  function getSelectedCards() {
    if (!selection) return [];
    if (selection.source === "waste") return [waste[waste.length - 1]];
    if (selection.source === "tableau") return tableau[selection.pileIndex].slice(selection.cardIndex);
    return [];
  }

  function removeSelectedCards() {
    if (!selection) return;
    if (selection.source === "waste") {
      waste.pop();
    } else if (selection.source === "tableau") {
      tableau[selection.pileIndex].splice(selection.cardIndex);
    }
  }

  function flipNewTopCardIfNeeded() {
    if (selection && selection.source === "tableau") {
      const pile = tableau[selection.pileIndex];
      if (pile.length > 0 && !pile[pile.length - 1].faceUp) {
        pile[pile.length - 1].faceUp = true;
      }
    }
  }

  function canPlaceOnFoundation(card, suit) {
    const pile = foundations[suit];
    if (pile.length === 0) return card.rank === 1;
    return card.suit === suit && card.rank === pile[pile.length - 1].rank + 1;
  }

  function canPlaceOnTableau(card, destPile) {
    if (destPile.length === 0) return card.rank === 13; // only Kings on empty columns
    const top = destPile[destPile.length - 1];
    return top.faceUp && top.rank === card.rank + 1 && suitIsRed(top.suit) !== suitIsRed(card.suit);
  }

  function attemptMoveToTableau(destColIndex) {
    if (!selection) return;
    const cards = getSelectedCards();
    if (cards.length === 0) return;

    // Don't allow dropping a pile onto itself
    if (selection.source === "tableau" && selection.pileIndex === destColIndex) {
      selection = null;
      render();
      return;
    }

    const destPile = tableau[destColIndex];
    const headCard = cards[0];

    if (canPlaceOnTableau(headCard, destPile)) {
      removeSelectedCards();
      flipNewTopCardIfNeeded();
      cards.forEach((c) => destPile.push(c));
      selection = null;
      messageEl.textContent = "";
      render();
    } else {
      messageEl.textContent = "That move isn't allowed.";
    }
  }

  function tryAutoFoundation(source, colIndex) {
    let card;
    if (source === "waste") {
      if (waste.length === 0) return;
      card = waste[waste.length - 1];
    } else {
      const pile = tableau[colIndex];
      if (pile.length === 0) return;
      card = pile[pile.length - 1];
    }
    if (canPlaceOnFoundation(card, card.suit)) {
      if (source === "waste") waste.pop();
      else tableau[colIndex].pop();

      foundations[card.suit].push(card);

      if (source === "tableau") {
        const pile = tableau[colIndex];
        if (pile.length > 0 && !pile[pile.length - 1].faceUp) {
          pile[pile.length - 1].faceUp = true;
        }
      }
      selection = null;
      render();
    }
  }

  function checkWin() {
    const total = SUITS.reduce((sum, s) => sum + foundations[s].length, 0);
    if (total === 52) {
      messageEl.textContent = "🎉 You win! 🎉";
    }
  }

  newGameBtn.addEventListener("click", newGame);
  newGame();
}
