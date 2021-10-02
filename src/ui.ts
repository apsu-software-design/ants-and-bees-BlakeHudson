import {AntGame, AntColony, Place, Hive} from './game';
import {Ant, EaterAnt, GuardAnt} from './ants';

import vorpal = require('vorpal');
import chalk = require('chalk');
import _ = require('lodash');

/**
 * The Vorpal library for command-line interaction
 */
const Vorpal = vorpal();
/**
 * 
 * @param game Object containing all properties to build the game map off of
 */
export function showMapOf(game:AntGame){
  console.log(getMap(game));
}

/**
 * builds game board based on current state of the game.
 * shows current number of turns, food, and boosts available
 * also shows matrix of available positions and tunnel locations
 * @param game 
 * @returns a string of current game status
 */
function getMap(game:AntGame) {
  let places:Place[][] = game.getPlaces();
  let tunnelLength = places[0].length;
  let beeIcon = chalk.bgYellow.black('B');
   /**
    * empty string for adding a map display game inforamtion the user.
    */
  let map = '';

  /*
   * Adds in bold information to map
   */
  map += chalk.bold('The Colony is under attack!\n');
  /*
   * adds turn and inventory information to map
   */
  map += `Turn: ${game.getTurn()}, Food: ${game.getFood()}, Boosts available: [${game.getBoostNames()}]\n`;
  /*
   * adds the number of each column to map and Hive at the end.
   */
  map += '     '+_.range(0,tunnelLength).join('    ')+'      Hive'+'\n';
   /*
    * iterates through length of places creating the game board and tunnels
    */
  for(let i=0; i<places.length; i++){
    map += '    '+Array(tunnelLength+1).join('=====');
    /*
     * adds number of Bee objects in Hive to end of first edge of board to lineup with 'Hive' display
     */
    if(i===0){
      map += '    ';
      let hiveBeeCount = game.getHiveBeesCount();
      if(hiveBeeCount > 0){
        map += beeIcon;
        map += (hiveBeeCount > 1 ? hiveBeeCount : ' ');
      }
    }
    /*
     * goes to next row after end of each row
     */
    map += '\n';
    /*
     * adds row number to beginning of each row.
     */
    map += i+')  ';
      /*
       * adds all ant icons to game board where needed
       */
    for(let j=0; j<places[i].length; j++){ 
      let place:Place = places[i][j];
      /*
       * adds all ant icons
       */
      map += iconFor(place.getAnt());
      map += ' '; 
      /*
       * adds icon for where a Bee object is on the game board and the number of Bee objects on that position.
       */
      if(place.getBees().length > 0){
        map += beeIcon;
        map += (place.getBees().length > 1 ? place.getBees().length : ' ');
      } else {
        map += '  ';
      }
      map += ' '; 
    }
    map += '\n    ';
    /*
     * designates where water is on the game board,
     * uses cyan background color to designate water visually
     */
    for(let j=0; j<places[i].length; j++){
      let place = places[i][j];
      if(place.isWater()){
        map += chalk.bgCyan('~~~~')+' ';
      } else {
        map += '==== ';
      }
    }
    map += '\n';
  }
  map += '     '+_.range(0,tunnelLength).join('    ')+'\n';

  return map;
}

/**
 * Uses the type of Ant to return the specific icon for it
 *  in string form.
 * @param ant Ant object to test find icon for
 * @returns icon for an ant in string form
 */
function iconFor(ant:Ant){
  if(ant === undefined){ return ' ' };
  let icon:string;
  switch(ant.name){
    case "Grower":
      icon = chalk.green('G'); break;
    case "Thrower":
      icon = chalk.red('T'); break;
    case "Eater":
      if((<EaterAnt>ant).isFull())
        icon = chalk.yellow.bgMagenta('E');
      else
        icon = chalk.magenta('E');
      break;
    case "Scuba":
      icon = chalk.cyan('S'); break;
    case "Guard":
      let guarded:Ant = (<GuardAnt>ant).getGuarded();
      if(guarded){
        icon = chalk.underline(iconFor(guarded)); break;
      } else {
        icon = chalk.underline('x'); break;
      }
    default:
      icon = '?';
  }
  return icon;
}

/**
 * Turns the CLI into play mode by using an AntGame object to create the board and logic.
 * Contains custom commands and prompts to guide the user through playing the game
 * and taking input.
 * Gives feedback to user when errors appear.
 * @param game AntGame object to play the game.
 */
export function play(game:AntGame) {
  /*
   * overrides Vorpal default delimiter,
   * displays game map properly using .log()
   * attaches the current instance of CLI's prompt to Vorpal
   */
  Vorpal
    .delimiter(chalk.green('AvB $'))
    .log(getMap(game))
    .show();
  /*
   * When 'show' command is initiated by user,
   * the current state of the game's map is displayed.
   */
  Vorpal
    .command('show', 'Shows the current game board.')
    .action(function(args, callback){
      Vorpal.log(getMap(game));
      callback();
    });

    /*
     * 'deploy' command and description
     * alternate names 'add' 'd'
     * adds an Ant to the specified location on the game map and displays the current state of the game map,
     * otherwise informs the user of any errors.
     */
  Vorpal
    .command('deploy <antType> <tunnel>', 'Deploys an ant to tunnel (as "row,col" eg. "0,6").')
    .alias('add', 'd')
    .autocomplete(['Grower','Thrower','Eater','Scuba','Guard'])
    .action(function(args, callback) {
      let error = game.deployAnt(args.antType, args.tunnel)
      if(error){
        Vorpal.log(`Invalid deployment: ${error}.`);
      }
      else {
        Vorpal.log(getMap(game));
      }
      callback();
    });
    /*
     * 'remove <tunnel>' command and description
     * alias 'rm'
     * requires row,col position of Ant to remove 
     * removes an Ant from the specified location on the game map and displays the current state of the game map,
     * otherwise informs the user of any errors.
     */
  Vorpal
    .command('remove <tunnel>', 'Removes the ant from the tunnel (as "row,col" eg. "0,6").')
    .alias('rm')
    .action(function(args, callback){
      let error = game.removeAnt(args.tunnel);
      if(error){
        Vorpal.log(`Invalid removal: ${error}.`);
      }
      else {
        Vorpal.log(getMap(game));
      }
      callback();
    });

  Vorpal
    .command('boost <boost> <tunnel>', 'Applies a boost to the ant in a tunnel (as "row,col" eg. "0,6")')
    .alias('b')
    .autocomplete({data:() => game.getBoostNames()})
    .action(function(args, callback){
      let error = game.boostAnt(args.boost, args.tunnel);
      if(error){
        Vorpal.log(`Invalid boost: ${error}`);
      }
      callback();
    })

  Vorpal
    .command('turn', 'Ends the current turn. Ants and bees will act.')
    .alias('end turn', 'take turn','t')
    .action(function(args, callback){
      game.takeTurn();
      Vorpal.log(getMap(game));
      let won:boolean = game.gameIsWon();
      if(won === true){
        Vorpal.log(chalk.green('Yaaaay---\nAll bees are vanquished. You win!\n'));
      }
      else if(won === false){
        Vorpal.log(chalk.yellow('Bzzzzz---\nThe ant queen has perished! Please try again.\n'));
      }
      else {
        callback();
      }
    });
}
