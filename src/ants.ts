import {AntColony, Place} from './game';
/**
 * Basis for creating other insects
 * contains name of insect, place, and armor count
 */
export abstract class Insect {
  readonly name:string;
  //constructor containing armor count and location
  constructor(protected armor:number, protected place:Place){}
  //getters and setters
  getName():string { return this.name; }
  getArmor():number { return this.armor; }
  getPlace() { return this.place; }
  setPlace(place:Place){ this.place = place; }
  /**
   * reduces the insect's armor count 
   * also removes the insect from the game if the insect has expired
   * An insect expires when its armor count reaches 0 or less
   * @param amount the amount of armor to reduce
   * @returns true if insect is out of armor and expired
   */
  reduceArmor(amount:number):boolean {
    this.armor -= amount;
    if(this.armor <= 0){
      console.log(this.toString()+' ran out of armor and expired');
      this.place.removeInsect(this);
      return true;
    }
    return false;
  }

  /**
   * To be implemented by each specific type of insect
   * @param colony optional parameter, not all insects belong to an AntColony
   */
  abstract act(colony?:AntColony):void;
  /**
   * insect name and place name formatted for string output
   * @returns Insect name and place if applicable
   */
  toString():string {
    return this.name + '('+(this.place ? this.place.name : '')+')';
  }
}

/**
 * Builder class for Bee
 */
export class Bee extends Insect {
  readonly name:string = 'Bee';
  private status:string;

  constructor(armor:number, private damage:number, place?:Place){
    super(armor, place);
  }

  /**
   * sting reduces an Ant's armor by the damage number of the Bee
   * @param ant the ant being stug
   * @returns returns reults of ants.reduceArmor()
   */
  sting(ant:Ant):boolean{
    console.log(this+ ' stings '+ant+'!');
    return ant.reduceArmor(this.damage);
  }

  /**
   * Determines whether a position is blocked by an Ant
   * @returns true if Ant is at same location
   */
  isBlocked():boolean {
    return this.place.getAnt() !== undefined;
  }

  setStatus(status:string) { this.status = status; }
  /**
   * Performs the act for a Bee turn
   * If a location is blocked by an Ant 
   * and Bee is not in 'stuck' or 'cold' statue
   * Bee stings Ant and reduces armor.
   */
  act() {
    if(this.isBlocked()){
      if(this.status !== 'cold') {
        this.sting(this.place.getAnt());
      }
    }
    else if(this.armor > 0) {
      if(this.status !== 'stuck'){
        this.place.exitBee(this);
      }
    }    
    this.status = undefined;
  }
}

/**
 * Base Ant class with basic functionality relevant to Ant type
 */
export abstract class Ant extends Insect {
  protected boost:string;
  constructor(armor:number, private foodCost:number = 0, place?:Place) {
    super(armor, place);
  }
  //getters and setters
  getFoodCost():number { return this.foodCost; }
  setBoost(boost:string) { 
    this.boost = boost; 
      console.log(this.toString()+' is given a '+boost);
  }
}

/**
 * Growers are ants that grow food and boosts. 
 * Each turn a Grower ant will either produce 1 food for the colony 
 * or a boost to be used by ither ants
 * Growers cost 1 food to deploy and have 1 armor.
 */
export class GrowerAnt extends Ant {
  readonly name:string = "Grower";
  constructor() {
    super(1,1)
  }
  /**
   * Uses Math function to produce a pseudo random number between 0 and 1
   * Based on the random number an action to the AntColony is performed
   * actions are adding a specific boost or increasing food.
   * @param colony AntColony to add the boost or food count to
   */
  act(colony:AntColony) {
    let roll = Math.random();
    if(roll < 0.6){
      colony.increaseFood(1);
    } else if(roll < 0.7) {
      colony.addBoost('FlyingLeaf');
    } else if(roll < 0.8) {
      colony.addBoost('StickyLeaf');
    } else if(roll < 0.9) {
      colony.addBoost('IcyLeaf');
    } else if(roll < 0.95) {
      colony.addBoost('BugSpray');
    }
  }  
}

/**
 * Throwers are ants that throw leaves at bees to drive them off. 
 * Each turn a Thrower ant will throw one leaf at the closest bee within range. 
 * Note that Throwers can throw different leaves when boosted. 
 * Throwers cost 4 food to deploy and have 1 armor
 */
export class ThrowerAnt extends Ant {
  readonly name:string = "Thrower";
  private damage:number = 1;

  constructor() {
    super(1,4);
  }

  /**
   * performs the action of a thrower
   * thrower ants have condiiontal actions based on a specific boost
   * boosts are passed in the form of a string
   */
  act() {
    if(this.boost !== 'BugSpray'){
      let target;
      if(this.boost === 'FlyingLeaf')
        target = this.place.getClosestBee(5);
      else
        target = this.place.getClosestBee(3);

      if(target){
        console.log(this + ' throws a leaf at '+target);
        target.reduceArmor(this.damage);
    
        if(this.boost === 'StickyLeaf'){
          target.setStatus('stuck');
          console.log(target + ' is stuck!');
        }
        if(this.boost === 'IcyLeaf') {
          target.setStatus('cold');
          console.log(target + ' is cold!');
        }
        this.boost = undefined;
      }
    }
    else {
      console.log(this + ' sprays bug repellant everywhere!');
      let target = this.place.getClosestBee(0);
      while(target){
        target.reduceArmor(10);
        target = this.place.getClosestBee(0);
      }
      this.reduceArmor(10);
    }
  }
}

/**
 * Eaters are ants that will eat the bees outright! 
 * On its turn, an Eater ant will swallow a bee in the same tunnel and begin digesting. 
 * It takes 3 turns to eat the bee and be ready to eat another. 
 * If the Eater is damaged or perishes quickly after swallowing the bee, it may cough up the invader! 
 * Eaters cost 4 food to deploy and have 2 armor.
 */
export class EaterAnt extends Ant {
  readonly name:string = "Eater";
  private turnsEating:number = 0;
  private stomach:Place = new Place('stomach');
  constructor() {
    super(2,4)
  }

  /**
   * Determines if there are bees in the eater ant's stomach
   * @returns true if at l one bee is in stomach
   */
  isFull():boolean {
    return this.stomach.getBees().length > 0;
  }

  /**
   * action for eating bee during turn
   * EaterAnts will try to eat the closest Bee to them as long as they do not have Bees in their stomach
   * EaterAnts will hold Bees in their stomach for 3 turns
   * After 3 turns the Bees are removed
   */
  act() {
    console.log("eating: "+this.turnsEating);
    if(this.turnsEating == 0){
      console.log("try to eat");
      let target = this.place.getClosestBee(0);
      if(target) {
        console.log(this + ' eats '+target+'!');
        this.place.removeBee(target);
        this.stomach.addBee(target);
        this.turnsEating = 1;
      }
    } else {
      if(this.turnsEating > 3){
        this.stomach.removeBee(this.stomach.getBees()[0]);
        this.turnsEating = 0;
      } 
      else 
        this.turnsEating++;
    }
  }  

  /**
   * If the EaterAnt has at least 1 or more armor then continue eating aciton
   * If the EaterAnt armor falls to 0 or below and it has been eating at least 1 turn
   * the Bees that it has eaten are removed fro
   * @param amount how much to reduce armor by
   * @returns 
   */
  reduceArmor(amount:number):boolean {
    this.armor -= amount;
    console.log('armor reduced to: '+this.armor);
    if(this.armor > 0){
      if(this.turnsEating == 1){
        let eaten = this.stomach.getBees()[0];
        this.stomach.removeBee(eaten);
        this.place.addBee(eaten);
        console.log(this + ' coughs up '+eaten+'!');
        this.turnsEating = 3;
      }
    }
    else if(this.armor <= 0){
      if(this.turnsEating > 0 && this.turnsEating <= 2){
        let eaten = this.stomach.getBees()[0];
        this.stomach.removeBee(eaten);
        this.place.addBee(eaten);
        console.log(this + ' coughs up '+eaten+'!');
      }
      return super.reduceArmor(amount);
    }
    return false;
  }
}

/**
 * ScubaAnt can  throw leaves at the closest Bee. 
 * A ScubaAnt can survive in water 
 * Scuba ants cost 5 food and have 1 armor.
 */
export class ScubaAnt extends Ant {
  readonly name:string = "Scuba";
  private damage:number = 1;

  constructor() {
    super(1,5)
  }

  /**
   * act is performed based on boost command 
   */
  act() {
    if(this.boost !== 'BugSpray'){
      let target;
      if(this.boost === 'FlyingLeaf')
        target = this.place.getClosestBee(5);
      else
        target = this.place.getClosestBee(3);

      if(target){
        console.log(this + ' throws a leaf at '+target);
        target.reduceArmor(this.damage);
    
        if(this.boost === 'StickyLeaf'){
          target.setStatus('stuck');
          console.log(target + ' is stuck!');
        }
        if(this.boost === 'IcyLeaf') {
          target.setStatus('cold');
          console.log(target + ' is cold!');
        }
        this.boost = undefined;
      }
    }
    else {
      console.log(this + ' sprays bug repellant everywhere!');
      let target = this.place.getClosestBee(0);
      while(target){
        target.reduceArmor(10);
        target = this.place.getClosestBee(0);
      }
      this.reduceArmor(10);
    }
  }
}

/**
 * GuardAnts have their armor reduced before other Ants occupying the same tunnel. 
 * GuardAnts cost 4 food to deploy and have 2 armor. 
 */
export class GuardAnt extends Ant {
  readonly name:string = "Guard";

  constructor() {
    super(2,4)
  }

  /**
   * returns the specific Ant that is being guarded
   * @returns Ant being guarded
   */
  getGuarded():Ant {
    return this.place.getGuardedAnt();
  }
  /**
   * GuardAnts do not perform an act during turns
   */
  act() {}
}
