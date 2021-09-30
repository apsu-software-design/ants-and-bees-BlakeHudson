import { Insect, Bee, Ant, GrowerAnt, ThrowerAnt, EaterAnt, ScubaAnt, GuardAnt } from './ants';
/**
 * Base class for creating a Place in the game 
 * a Place contains one or no Ant
 * one or no GuardAnt
 * 0 or more Bees contained in an Array
 */
class Place {
  protected ant: Ant;
  protected guard: GuardAnt;
  protected bees: Bee[] = [];

  constructor(readonly name: string,
    protected readonly water = false,
    private exit?: Place,
    private entrance?: Place) { }

    // getters and setters
  getExit(): Place { return this.exit; }

  setEntrance(place: Place) { this.entrance = place; }

  /**
   * true if position is water, false if not.
   * @returns true if Place is water 
   */
  isWater(): boolean { return this.water; }
  /**
   * retrieves and Ant within the particular place
   * returns GuardAnt type before returning other Ant types 
   * if a GuardAnt exists
   * @returns 
   */
  getAnt(): Ant {
    if (this.guard)
      return this.guard;
    else
      return this.ant;
  }
  /**
   * A "guarded ant" is an Ant that occupies the same tunnel as a GuardAnt
   * @returns ant occupying same tunnel as GuardAnt
   */
  getGuardedAnt(): Ant {
    return this.ant;
  }

  //getter
  getBees(): Bee[] { return this.bees; }
  /**
   * finds the closest Bee within a given range
   * if no Bee is in specified range return undefined
   * @param maxDistance max distance to search for a Bee
   * @param minDistance number set to 0
   * @returns closest Bee in range otherwise undefined
   */
  getClosestBee(maxDistance: number, minDistance: number = 0): Bee {
    let p: Place = this;
    for (let dist = 0; p !== undefined && dist <= maxDistance; dist++) {
      if (dist >= minDistance && p.bees.length > 0) {
        return p.bees[0];
      }
      p = p.entrance;
    }
    return undefined;
  }

  addAnt(ant: Ant): boolean {
    if (ant instanceof GuardAnt) {
      if (this.guard === undefined) {
        this.guard = ant;
        this.guard.setPlace(this);
        return true;
      }
    }
    else
      if (this.ant === undefined) {
        this.ant = ant;
        this.ant.setPlace(this);
        return true;
      }
    return false;
  }
/**
 * removes an ant
 * if there is a GuardAnt remove that ant and return,
 * otherewise remove Ant from place
 * @returns Ant or GuardAnt being removed
 */
  removeAnt(): Ant {
    if (this.guard !== undefined) {
      let guard = this.guard;
      this.guard = undefined;
      return guard;
    }
    else {
      let ant = this.ant;
      this.ant = undefined;
      return ant;
    }
  }

  /**
   * appends a Bee onto bees Array
   * @param bee Bee object to be added 
   */
  addBee(bee: Bee): void {
    this.bees.push(bee);
    bee.setPlace(this);
  }
/**
 * removes a Bee from bees by passing the Bee object as a param
 * the index of the Bee is extraced and removed from bees
 * bee's Place is set to undefined
 * @param bee Bee to be removed
 */
  removeBee(bee: Bee): void {
    var index = this.bees.indexOf(bee);
    if (index >= 0) {
      this.bees.splice(index, 1);
      bee.setPlace(undefined);
    }
  }
/**
 * removes all bees by setting each Bee in bees' place to undefined
 * bees is set to an empty array
 */
  removeAllBees(): void {
    this.bees.forEach((bee) => bee.setPlace(undefined));
    this.bees = [];
  }

  exitBee(bee: Bee): void {
    this.removeBee(bee);
    this.exit.addBee(bee);
  }

  removeInsect(insect: Insect) {
    if (insect instanceof Ant) {
      this.removeAnt();
    }
    else if (insect instanceof Bee) {
      this.removeBee(insect);
    }
  }
/**
 * if Place contains water, remove ant Ant that is not a ScubaAnt
 */
  act() {
    if (this.water) {
      if (this.guard) {
        this.removeAnt();
      }
      if (!(this.ant instanceof ScubaAnt)) {
        this.removeAnt();
      }
    }
  }
}


class Hive extends Place {
  private waves: { [index: number]: Bee[] } = {}

  constructor(private beeArmor: number, private beeDamage: number) {
    super('Hive');
  }

  addWave(attackTurn: number, numBees: number): Hive {
    let wave: Bee[] = [];
    for (let i = 0; i < numBees; i++) {
      let bee = new Bee(this.beeArmor, this.beeDamage, this);
      this.addBee(bee);
      wave.push(bee);
    }
    this.waves[attackTurn] = wave;
    return this;
  }

  invade(colony: AntColony, currentTurn: number): Bee[] {
    if (this.waves[currentTurn] !== undefined) {
      this.waves[currentTurn].forEach((bee) => {
        this.removeBee(bee);
        let entrances: Place[] = colony.getEntrances();
        let randEntrance: number = Math.floor(Math.random() * entrances.length);
        entrances[randEntrance].addBee(bee);
      });
      return this.waves[currentTurn];
    }
    else {
      return [];
    }
  }
}


class AntColony {
  private food: number;
  private places: Place[][] = [];
  private beeEntrances: Place[] = [];
  private queenPlace: Place = new Place('Ant Queen');
  private boosts: { [index: string]: number } = { 'FlyingLeaf': 1, 'StickyLeaf': 1, 'IcyLeaf': 1, 'BugSpray': 0 }

  constructor(startingFood: number, numTunnels: number, tunnelLength: number, moatFrequency = 0) {
    this.food = startingFood;

    let prev: Place;
    for (let tunnel = 0; tunnel < numTunnels; tunnel++) {
      let curr: Place = this.queenPlace;
      this.places[tunnel] = [];
      for (let step = 0; step < tunnelLength; step++) {
        let typeName = 'tunnel';
        if (moatFrequency !== 0 && (step + 1) % moatFrequency === 0) {
          typeName = 'water';
        }

        prev = curr;
        let locationId: string = tunnel + ',' + step;
        curr = new Place(typeName + '[' + locationId + ']', typeName == 'water', prev);
        prev.setEntrance(curr);
        this.places[tunnel][step] = curr;
      }
      this.beeEntrances.push(curr);
    }
  }

  getFood(): number { return this.food; }

  increaseFood(amount: number): void { this.food += amount; }

  getPlaces(): Place[][] { return this.places; }

  getEntrances(): Place[] { return this.beeEntrances; }

  getQueenPlace(): Place { return this.queenPlace; }

  queenHasBees(): boolean { return this.queenPlace.getBees().length > 0; }

  getBoosts(): { [index: string]: number } { return this.boosts; }

  addBoost(boost: string) {
    if (this.boosts[boost] === undefined) {
      this.boosts[boost] = 0;
    }
    this.boosts[boost] = this.boosts[boost] + 1;
    console.log('Found a ' + boost + '!');
  }

  deployAnt(ant: Ant, place: Place): string {
    if (this.food >= ant.getFoodCost()) {
      let success = place.addAnt(ant);
      if (success) {
        this.food -= ant.getFoodCost();
        return undefined;
      }
      return 'tunnel already occupied';
    }
    return 'not enough food';
  }

  removeAnt(place: Place) {
    place.removeAnt();
  }

  applyBoost(boost: string, place: Place): string {
    if (this.boosts[boost] === undefined || this.boosts[boost] < 1) {
      return 'no such boost';
    }
    let ant: Ant = place.getAnt();
    if (!ant) {
      return 'no Ant at location'
    }
    ant.setBoost(boost);
    return undefined;
  }

  antsAct() {
    this.getAllAnts().forEach((ant) => {
      if (ant instanceof GuardAnt) {
        let guarded = ant.getGuarded();
        if (guarded)
          guarded.act(this);
      }
      ant.act(this);
    });
  }

  beesAct() {
    this.getAllBees().forEach((bee) => {
      bee.act();
    });
  }

  placesAct() {
    for (let i = 0; i < this.places.length; i++) {
      for (let j = 0; j < this.places[i].length; j++) {
        this.places[i][j].act();
      }
    }
  }

  getAllAnts(): Ant[] {
    let ants = [];
    for (let i = 0; i < this.places.length; i++) {
      for (let j = 0; j < this.places[i].length; j++) {
        if (this.places[i][j].getAnt() !== undefined) {
          ants.push(this.places[i][j].getAnt());
        }
      }
    }
    return ants;
  }

  getAllBees(): Bee[] {
    var bees = [];
    for (var i = 0; i < this.places.length; i++) {
      for (var j = 0; j < this.places[i].length; j++) {
        bees = bees.concat(this.places[i][j].getBees());
      }
    }
    return bees;
  }
}

/**
 * calls all necessary functions and stores information to take a turn in the game
 * ends game if necessary
 */
class AntGame {

  private turn: number = 0;
  constructor(private colony: AntColony, private hive: Hive) { }

  /*calls all functions for a turn to take place
   *ants, bees, place, and hive actions are performed
   *adds a count to turn number
  */
  takeTurn() {
    console.log('');
    this.colony.antsAct();
    this.colony.beesAct();
    this.colony.placesAct();
    this.hive.invade(this.colony, this.turn);
    this.turn++;
    console.log('');
  }

  //getter
  getTurn() { return this.turn; }

  /**
   * Checks to see if the user has won the game.
   * The user has won if there are no more bees in the hive and colony.
   * @returns true if user has won the game, false otherwise.
   */
  gameIsWon(): boolean | undefined {
    if (this.colony.queenHasBees()) {
      return false;
    }
    else if (this.colony.getAllBees().length + this.hive.getBees().length === 0) {
      return true;
    }
    return undefined;
  }

  /**
   * receives location and ant type to deploy to game based on user input 
   * and creates the appropriate new ant and deploys it to game.
   * @param antType user input for ant type to deploy
   * @param placeCoordinates row,col style coordinates on gameboard matrix for deployment location
   * @returns 
   */
  deployAnt(antType: string, placeCoordinates: string): string {
    let ant;
    switch (antType.toLowerCase()) {
      case "grower":
        ant = new GrowerAnt(); break;
      case "thrower":
        ant = new ThrowerAnt(); break;
      case "eater":
        ant = new EaterAnt(); break;
      case "scuba":
        ant = new ScubaAnt(); break;
      case "guard":
        ant = new GuardAnt(); break;
      default:
        return 'unknown ant type';
    }
    //tests for valid coordinates on game board matrix
    try {
      let coords = placeCoordinates.split(',');
      let place: Place = this.colony.getPlaces()[coords[0]][coords[1]];
      return this.colony.deployAnt(ant, place);
    } catch (e) {
      return 'illegal location';
    }
  }

  /**
   * removes an ant from the game based on user entered coordinates
   * @param placeCoordinates row,col style matrix coordinates
   * @returns 
   */
  removeAnt(placeCoordinates: string): string {
    try {
      let coords = placeCoordinates.split(',');
      let place: Place = this.colony.getPlaces()[coords[0]][coords[1]];
      place.removeAnt();
      return undefined;
    } catch (e) {
      return 'illegal location';
    }
  }
  /**
   * applies the specifed boost type to the ant at the specified coordinates
   * @param boostType 
   * @param placeCoordinates row,col style matrix coordinates
   * @returns 
   */
  boostAnt(boostType: string, placeCoordinates: string): string {
    try {
      let coords = placeCoordinates.split(',');
      let place: Place = this.colony.getPlaces()[coords[0]][coords[1]];
      return this.colony.applyBoost(boostType, place);
    } catch (e) {
      return 'illegal location';
    }
  }
  //getters
  getPlaces(): Place[][] { return this.colony.getPlaces(); }
  getFood(): number { return this.colony.getFood(); }
  getHiveBeesCount(): number { return this.hive.getBees().length; }
  getBoostNames(): string[] {
    let boosts = this.colony.getBoosts();
    return Object.keys(boosts).filter((boost: string) => {
      return boosts[boost] > 0;
    });
  }
}

export { AntGame, Place, Hive, AntColony }