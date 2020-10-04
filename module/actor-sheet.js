/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class SimpleActorSheet extends ActorSheet {

  /** @override */
	static get defaultOptions() {
	  return mergeObject(super.defaultOptions, {
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

  /** @override */
  getData() {
    const data = super.getData();

    if (this.actor.data.type == 'hunter') {
      this._prepareHunterRatings(data);
      this._prepareHunterItems(data);
    }

    return data;
  }

  /**
   * Adds '+' in front of positive ratings.
   *
   * @param {Object} sheetData The sheet containing the actor to prepare.
   */
  _prepareHunterRatings(sheetData) {
    let ratings = sheetData.actor.data.ratings;
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

    // Initialize containers.
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

    // TODO: Sort each list by name

    actorData.weapons = weapons;
    actorData.armor = armor;
    actorData.gear = gear;
    actorData.moves = moves;
  }

  /* -------------------------------------------- */

  /** @override */
	activateListeners(html) {
    super.activateListeners(html);

    // Roll when clicking the name of a rating.
    html.find('.rating .rollable').click(ev => {
      let button = $(ev.currentTarget);
      let r = new Roll(button.data('roll'), this.actor.getRollData()).roll();

      var tier;
      if (r.total >= 10) {
        tier = game.i18n.localize("SIMPLE.TotalSuccess");
      } else if (r.total >= 7) {
        tier = game.i18n.localize("SIMPLE.MixedSuccess");
      } else {
        tier = game.i18n.localize("SIMPLE.Failure");
      }

      r.toMessage({
        user: game.user._id,
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: `<h2>${button.text()}</h2><i>${tier}</i>`
      });
    });

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // Handle clicks on "track" elements and update the underlying values.
    html.find(".track-element").click(ev => {
      const valueName = $(ev.currentTarget).parents(".track").data("valueName");
      const delta = ev.currentTarget.classList.contains("marked") ? -1 : 1;
      this.actor.modifyValue(valueName, delta);
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

  /** @override */
  setPosition(options={}) {
    const position = super.setPosition(options);
    const sheetBody = this.element.find(".sheet-body");
    const bodyHeight = position.height - 192;
    sheetBody.css("height", bodyHeight);
    return position;
  }

  /* -------------------------------------------- */

  /** @override */
  _updateObject(event, formData) {
    // TODO: Lets us intercept edits before sending to the server.
    // formData contains name:value pairs from <input> elements etc. in the form.

    // Update the Actor
    return this.object.update(formData);
  }
}
