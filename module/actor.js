/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class SimpleActor extends Actor {

  /** @override */
  getRollData() {
    // TODO: "Prepare a data object which defines the data schema used by dice
    //     roll commands against this Actor"
    const data = super.getRollData();
    return data;
  }
}
