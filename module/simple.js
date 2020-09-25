/**
 * A simple and flexible system for world-building using an arbitrary collection
 * of character and item attributes.
 * Author: Atropos
 * Software License: GNU GPLv3
 */

// Import Modules
import { SimpleActor } from "./actor.js";
import { SimpleItemSheet } from "./item-sheet.js";
import { SimpleActorSheet } from "./actor-sheet.js";
import { preloadHandlebarsTemplates } from "./templates.js";

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */

Hooks.once("init", async function() {
  console.log(`Initializing Monster of the Week`);

  /**
   * Set an initiative formula for the system.
   */
  CONFIG.Combat.initiative = {
    formula: "2d6",
    decimals: 2
  };

  // Define custom Entity classes
  CONFIG.Actor.entityClass = SimpleActor;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("monsterweek", SimpleActorSheet, {
    types: ["hunter", "bystander", "location", "minion", "monster"],
    makeDefault: true
  });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("monsterweek", SimpleItemSheet, {
    types: ["weapon", "armor", "gear", "move"],
    makeDefault: true
  });

  /**
   * Concatenate multiple strings and variables.
   * From https://stackoverflow.com/a/35862620
   */
  Handlebars.registerHelper('concat', function() {
    var arg = Array.prototype.slice.call(arguments,0);
    arg.pop();
    return arg.join('');
  });

  // Preload template partials.
  preloadHandlebarsTemplates();
});