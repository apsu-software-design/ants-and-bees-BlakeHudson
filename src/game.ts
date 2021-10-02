import { Insect, Bee, Ant, GrowerAnt, ThrowerAnt, EaterAnt, ScubaAnt, GuardAnt } from './ants';
/**
 * Base class for creating a Place in the game 
 * A Place allows Insects to be added, removed, and perform actions
 * based on other Insects in the same Place
 * a Place contains one or no Ant
 * one or no GuardAnt
 * 0 or more Bee Objects
 */
class Place {
  protected ant: Ant;
  protected guard: GuardAnt;
  protected bees: Bee[] = [];
  /**
   * 
   * @param name name of Place
   * @param water is the place water
   * @param exit exit point
   * @param entrance entrance point
   */
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
  /**
   * add Ant to Place
   * sets appropriate properties based on whether ant is a GuardAnt or not.
   * @param ant 
   * @returns 
   */
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
   * adds bee to bees
   * @param bee Bee object to be added 
   */
  addBee(bee: Bee): void {
    this.bees.push(bee);
    bee.setPlace(this);
  }
/**
 * removes a Bee from bees by passing the Bee object as a param
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
 * removes all bees in Place by setting each Bee in bees' place
 * resets all appropriate properties of Place for Bee removal
 */
  removeAllBees(): void {
    this.bees.forEach((bee) => bee.setPlace(undefined));
    this.bees = [];
  }

  /**
   * removes the single Bee passed from Place
   * @param bee Bee to be removed
   */
  exitBee(bee: Bee): void {
    this.removeBee(bee);
    this.exit.addBee(bee);
  }
/**
 * removes either a Bee or Ant Insect
 * @param insect Insect to be removed
 */
  removeInsect(insect: Insect) {
    if (insect instanceof Ant) {
      this.removeAnt();
    }
    else if (insect instanceof Bee) {
      this.removeBee(insect);
    }
  }
/**
 * if Place contains water, remove any Ant that is not a ScubaAnt
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

/**
 * Hive is a type of Place that contains 0 or more Bee Objects
 */
class Hive extends Place {
  private waves: { [index: number]: Bee[] } = {}
/**
 * Hive constructor sets armor and damage
 * @param beeArmor amount of damage damage waves can take
 * @param beeDamage amount of damage dealt out by waves
 */
  constructor(private beeArmor: number, private beeDamage: number) {
    super('Hive');
  }
/**
 * Adds all Bee Objects that will perform an action in the next turn of the game.
 * @param attackTurn round of turn in the game.
 * @param numBees total number of Bee Objects added to the attack wave.
 * @returns Hive Object containing all BEe objects for next turn in game.
 */
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
/**
 * Randomly disperses all Bee objects contained in waces matching the turn number
 * to tunnels in the AntColony.
 * @param colony AntColony to disperse Bee objects to
 * @param currentTurn turn number
 * @returns remaining Bee Objects
 */
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

/**
 * Class to coordinate turn acts and interaction between all Bee, Ant, and Place objects in the game.
 */
class AntColony {
  private food: number;
  private places: Place[][] = [];
  private beeEntrances: Place[] = [];
  private queenPlace: Place = new Place('Ant Queen');
  private boosts: { [index: string]: number } = { 'FlyingLeaf': 1, 'StickyLeaf': 1, 'IcyLeaf': 1, 'BugSpray': 0 }

  /**
   * AntColony constructor initializes amount of food and availavle Boost objects.
   * Creates the AntColony tunnels with entraces for Bees.
   * Adds water to tunnels, and places location of 'Queen Ant'.
   * @param startingFood 
   * @param numTunnels 
   * @param tunnelLength 
   * @param moatFrequency 
   */
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
  //getters and basic methods 
  getFood(): number { return this.food; }

  increaseFood(amount: number): void { this.food += amount; }

  getPlaces(): Place[][] { return this.places; }

  getEntrances(): Place[] { return this.beeEntrances; }

  getQueenPlace(): Place { return this.queenPlace; }

  queenHasBees(): boolean { return this.queenPlace.getBees().length > 0; }

  getBoosts(): { [index: string]: number } { return this.boosts; }

  /**
   * adds a new Boost Object to AntColony Boost inventory for access by the User.
   * @param boost string matching name of Boost to add
   */
  addBoost(boost: string) {
    if (this.boosts[boost] === undefined) {
      this.boosts[boost] = 0;
    }
    this.boosts[boost] = this.boosts[boost] + 1;
    console.log('Found a ' + boost + '!');
  }
/**
 * Adds an Ant Object to a Place if enough food is available
 * reduces food count of AntColony after new Ant object is created. 
 * @param ant ANt object to be depolyed
 * @param place Place Object location where the ant is to be deployed
 * @returns feedback if ant cannot be deployed to specified Place
 */
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
/**
 * removes an Ant from particular Place object
 * @param place Place object to remove ant from
 */
  removeAnt(place: Place) {
    place.removeAnt();
  }

  /**
   * Applies specified Boost at given Location.
   * Checks and gives feedback that Boost name is entered correctly,
   * Boost is available in inventory,
   * and Ant is at the location given.
   * @param boost name of Boost to apply
   * @param place location where to apply Boost
   * @returns 
   */
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

  /**
   * Calls all turn actions for Ants in AntColony.
   */
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
  /**
   * Calls turn action for all available Bee Objects.
   */
  beesAct() {
    this.getAllBees().forEach((bee) => {
      bee.act();
    });
  }
/**
 * Calls all turn actions for Places in AntColony
 */
  placesAct() {
    for (let i = 0; i < this.places.length; i++) {
      for (let j = 0; j < this.places[i].length; j++) {
        this.places[i][j].act();
      }
    }
  }
/**
 * retrieves all Ant objects in AntColony.
 * @returns array of Ant objects in all Places in AntColony
 */
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
/**
 * 
 * @returns array of Bee objects in all Places in AntColony
 */
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
   * Applies the specifed boost type to the ant at the specified coordinates.
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