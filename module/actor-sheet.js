/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */

export class SimpleActorSheet extends ActorSheet {

  /** @inheritdoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["monsterweek", "sheet", "actor"],
      template: "systems/monsterweek/templates/actor-sheet.html",
      width: 600,
      height: 600,
      tabs: [
        {
          navSelector: ".tab-nav-left",
          contentSelector: ".tab-content-left",
          initial: "moves",
        },
        {
          navSelector: ".tab-nav-right",
          contentSelector: ".tab-content-right",
          initial: "gear",
        },
      ],
      dragDrop: [{dragSelector: ".item-list .item", dropSelector: null}]
    });
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  getData() {
    const context = super.getData();
    context.systemData = context.data.data;

    if (this.actor.data.type == 'hunter') {
      this._prepareHunterRatings(context);
      this._prepareHunterItems(context);
    }

    // This is the object that determines the namespace
    // seen by the HTML templates.
    return context;
  }

  /**
   * Adds '+' in front of positive ratings.
   *
   * @param {Object} sheetData The sheet containing the actor to prepare.
   */
  _prepareHunterRatings(sheetData) {
    let ratings = sheetData.data.data.ratings;
    for (let key in ratings) {
      if (ratings.hasOwnProperty(key)) {
        let rating = ratings[key];
        if (rating.hasOwnProperty("value") && rating.value > 0) {
          rating.value = "+" + rating.value;
        }
      }
    }
  }

  /**
   * Organize and classify Items for Hunter sheets.
   *
   * @param {Object} sheetData The sheet containing the actor to prepare.
   *
   * @return {undefined}
   */
  _prepareHunterItems(sheetData) {
    const actorData = sheetData.actor;

    const weapons = [];
    const armor = [];
    const gear = [];
    const moves = [];

    // Iterate through items, allocating to containers
    for (let i of sheetData.items) {
      i.img = i.img || DEFAULT_TOKEN;
      if (i.type === 'weapon') {
        weapons.push(i);
      }
      else if (i.type === 'armor') {
        armor.push(i);
      }
      else if (i.type === 'gear') {
        gear.push(i);
      }
      else if (i.type === 'move') {
        moves.push(i);
      }
    }

    actorData.moves = moves;
    actorData.allGear = [
      // Labels must correspond to SIMPLE.${label} localizable strings.
      {"label": "Weapons", "items": weapons},
      {"label": "Armor", "items": armor},
      {"label": "Gear", "items": gear},
    ];
  }

  /* -------------------------------------------- */

  /**
   * Handles rolling a rating like "Cool" when clicking on its name.
   * @private
   */
  _onRatingRoll(ev) {
    ev.preventDefault();
    ev.stopPropagation();

    let button = $(ev.currentTarget);
    let itemId = button.data("item-id") || "";
    let rating = button.data("rating");
    let ratingName = game.i18n.localize("SIMPLE." + rating);
    let r = new Roll(`2d6 + @ratings.${rating}.value`, this.actor.getRollData()).roll();



    let desc = this.getItemDesc(itemId);


    let tier;
    if (r.total >= 10) {
      tier = game.i18n.localize("SIMPLE.TotalSuccess");
    } else if (r.total >= 7) {
      tier = game.i18n.localize("SIMPLE.MixedSuccess");
    } else {
      tier = game.i18n.localize("SIMPLE.Failure");
    }

    let title = button.data("title");
    if (!title) {
      title = ratingName;
    }

    r.toMessage({
      user: game.user._id,
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: `<li class="item"><h2 class="item-chat">${title}</h2><div class="item-chat-desc" style="display: none;">${desc}</div></li><h4>(${ratingName})</h4><h3><i>${tier.toUpperCase()}</i></h3>`
    });
  }


  getItemDesc(itemId) {
    const item = this.actor.items.get(itemId);
    return item?.data.data.description || "";
  }

  /* -------------------------------------------- */

  /**
   * Shows/hides item (move/gear/etc.) summaries when clicking on item names.
   * @private
   */
  _onItemNameClick(event) {
    event.preventDefault();
    let li = $(event.currentTarget).parents(".item");
    let item = this.actor.getOwnedItem(li.data("item-id"));

    // Toggle summary
    if (li.hasClass("item-expanded")) {
      let summary = li.children(".item-summary");
      summary.slideUp(200, () => summary.remove());
    } else {
      let div = $(`<div class="item-summary">${item.data.data.description}</div>`);
      li.append(div.hide());
      div.slideDown(200);
    }
    li.toggleClass("item-expanded");
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  activateListeners(html) {
    super.activateListeners(html);

    if (this.actor.isOwner) {
      // Roll when clicking the name of a rating.
      html.find(".rollable").on("click", this._onRatingRoll.bind(this));
    }

    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Handle clicks on "track" elements and update the underlying values.
    html.find(".track-element").click(ev => {
      const valueName = $(ev.currentTarget).parents(".track").data("valueName");
      const delta = ev.currentTarget.classList.contains("marked") ? -1 : 1;
      this.actor.modifyValue(valueName, delta);
    });

    // Show/hide item (move/gear/etc) summaries when clicking on item names.
    html.find('.item-list .item .item-name').click(ev => {
      ev.preventDefault();
      const parentElem = $(ev.currentTarget).parents(".item");
      let descDiv = parentElem.children('div.item-summary');

      if($(descDiv).html() === "") {
        descDiv.append(this.getItemDesc(parentElem.data('item-id')));
      }

      $(descDiv).slideToggle(200);
    });

    // Add Inventory Item
    html.find('.item-create').click(ev => {
      ev.preventDefault();

      // TODO: Consolidate this with the similar list in simple.js.
      const DEFAULT_MOVE_ICON = "icons/svg/book.svg"
      const DEFAULT_GEAR_ICON = "icons/svg/chest.svg";
      const DEFAULT_WEAPON_ICON = "icons/svg/combat.svg";
      const DEFAULT_ARMOR_ICON = "icons/svg/statue.svg";

      // The incoming type will be a localization key like "Moves", but
      // we need an item type like "move".
      const headerType = $(ev.currentTarget).data("type");
      const entry = {
        Moves: { type: "move", img: DEFAULT_MOVE_ICON },
        Weapons: { type: "weapon", img: DEFAULT_WEAPON_ICON },
        Armor: { type: "armor", img: DEFAULT_ARMOR_ICON },
        Gear: { type: "gear", img: DEFAULT_GEAR_ICON },
      }[headerType];

      const itemData = {
        name: game.i18n.format("SIMPLE.NewItem"),
        type: entry.type,
        img: entry.img,
        data: {},
      };
      return this.actor.createOwnedItem(itemData);
    });

    // Update Inventory Item
    html.find('.item-edit').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.getOwnedItem(li.data("itemId"));
      item.sheet.render(true);
    });

    // Delete Inventory Item
    html.find('.item-delete').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      this.actor.deleteOwnedItem(li.data("itemId"));
      li.slideUp(200, () => this.render(false));
    });
  }

  /* -------------------------------------------- */

  /**
   * @inheritdoc
   * Called when the sheet window is moved or resized.
   */
  setPosition(options={}) {
    const position = super.setPosition(options);

    // Let any tab bodies know that the viewport has changed.
    const tabBodies = this.element.find(".tab-content .tab");
    if (tabBodies.length > 0) {
      // See how much of the window height belongs to the tabs. Assumes that all
      // tab bodies have the same y position.
      //
      // Use the `offsetTop` of the tab body's parent element (typically a div
      // that contains all bodies for the tab group) in case tab body zero is
      // currently hidden. Note that this offset is relative to `this.element`
      // since we looked up the tab using `this.element.find`.
      const tabHeight = position.height - tabBodies[0].parentElement.offsetTop;
      tabBodies.css("height", tabHeight);
    }

    return position;
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  _updateObject(event, formData) {
    // TODO: Replace this with _getSubmitData().

    // Lets us intercept edits before sending to the server.
    // formData contains name/value pairs from <input> elements etc. in the form.

    // Update the Actor
    return this.object.update(formData);
  }
}