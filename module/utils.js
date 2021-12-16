import { SimpleActorSheet } from "./actor-sheet.js";

export class Utils {

    static moveDescriptionToggler(elem, actor, itemId) {
        let item = actor.items.get(itemId);

        let desc = item?.data.data.description || "";

        if(!item) {
            item = {data: {data: {description: 'err'}}};
        }

        // Toggle summary
        if (elem.hasClass("item-expanded")) {
            let summary = elem.children(".item-summary");
            summary.slideUp(200, () => summary.remove());
        } else {
            const div = $(`<div class="item-summary">${desc}</div>`);
            elem.append(div.hide());
            div.slideDown(200);
        }
        elem.toggleClass("item-expanded");
    }
}