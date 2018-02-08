// We will use `strict mode`, which helps us by having the browser catch many common JS mistakes
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode
"use strict";

const app = new PIXI.Application(502,600);
//document.body.appendChild(app.view);
document.getElementById('gameDiv').appendChild(app.view);

// constants
const sceneWidth = app.view.width;
const sceneHeight = app.view.height;	

// pre-load the images
/*PIXI.loader.
add(["images/Bubble.png","images/droplet.png"]).
on("progress",e=>{console.log(`progress=${e.progress}`)}).
load(setup);*/

let bubTex = PIXI.Texture.fromImage("images/Bubble.png");
let dropTex = PIXI.Texture.fromImage("images/droplet.png");

// aliases
let stage;

// game variables
let startScene;
let gameScene,ship,scoreLabel,turnsLabel,shootSound,hitSound;
let gameOverScene;

let grid = new Array(5);
let bubbles = new Array(5);
let dropletArray = [];

let destroyBub = [];
let destroyDrop = [];

let bubExplode = [];
let bubAdd = [];

let score = 0;
let turns = 10;
let levelNum = 1;
let paused = true;


let gameOverScoreLabel;
let gameOverHighScoreLabel;

//web Storage
//let highScore;
const prefix = "lcb2374-";
const nameKey = prefix + "HighScore";
let storedHighScore = localStorage.getItem(nameKey);


//Sets up the scenes, buttons and gameloop.
function setup() {
    
    
	stage = app.stage;
	// #1 - Create the `start` scene
    startScene = new PIXI.Container();
	stage.addChild(startScene);
	// #2 - Create the main `game` scene and make it invisible
    gameScene = new PIXI.Container();
    gameScene.visible = false;
	stage.addChild(gameScene);
	// #3 - Create the `gameOver` scene and make it invisible
	gameOverScene = new PIXI.Container();
    gameOverScene.visible = false;
	stage.addChild(gameOverScene);
	// #4 - Create labels for all 3 scenes
	createLabelsAndButtons();
    
    shootSound = new Howl({
	src: ['sounds/shootDrop.wav']
    });

    hitSound = new Howl({
        src: ['sounds/bubbleHit.wav']
    });
    
	app.ticker.add(gameLoop);
    
    
}

//loop executed once per second, where all game code whould go/be called
function gameLoop(){
	 if (paused) return; // keep this commented out for now
	
	// #1 - Calculate "delta time"
	let dt = 1/app.ticker.FPS;
    if (dt > 1/12) dt=1/12;
    
    
    
    //move all bubble bullets around
    dropletArray.forEach(function(drops){
        drops.move(dt);
    });
    
    //check for collissions
    //if i bullet collides with a small bubble, increase size
    //otherwise, explode it
    for(let b of bubbles){
        for(let d of dropletArray){
            if(rectsIntersect(b,d)){
                //console.log();
               if(b.size == 4){
                        b.explodeTrigger = true;
                }
                else if(b.isAlive){
                    hitSound.play();
                    b.size += 1;
                    let spawn =new Circle(b.size * 15,b.size * 15, bubTex,b.x,b.y, b.size);
                    gameScene.addChild(spawn);
                    bubAdd.push(spawn);
                    
                }
                gameScene.removeChild(b);
                 b.isAlive = false;
                gameScene.removeChild(d);
                d.isAlive = false;
                increaseScoreBy(1);
                
                 
            }
        }
    }
    
    // removing bullets that are out of bounds
    for(let d of dropletArray){
        //console.log(d.x + " "+ d.y )
        if(d.x >500 || d.x<0 ||d.y >600 || d.y<100 ){
           d.isAlive = false;
            gameScene.removeChild(d);
           }
        
    }
    
    //if a bubble died then set off an explosion of droplets
    destroyBub = bubbles.filter(b =>b.explodeTrigger== true);
    destroyBub.forEach(function(bub){
    ExplodeChain(bub);
        
    });
    
    //delete dead droplets and bubbles
    dropletArray = dropletArray.filter(d =>d.isAlive);
    bubbles = bubbles.filter(b =>b.isAlive);

    //add new bubbles (increasing the size involves deleting the old bubble and creating one of a bigger size)
    bubbles = bubbles.concat(bubAdd);
    bubAdd = [];
    
    
    
    //conditions for winning and loading new level
    if(bubbles.length == 0){
        levelNum += 1;
        score += 100;
        turns += 5;
        increaseScoreBy(0);
        decreaseTurnsBy(0);
        loadLevel();
       }
    
	//game over conditions
	if (turns <= 0){
	end();
	return;
    }
}

//sets up all text and buttons for the game
function createLabelsAndButtons(){
    
    let buttonStyle = new PIXI.TextStyle({
        fill: 0xa3d4ff,
        fontSize: 50,
        fontFamily: 'Bungee'
    });
    
    let startLabel1 = new PIXI.Text("Bubble Poppin'");
    startLabel1.style = new PIXI.TextStyle({
        fill: 0xb6ddff,
        fontSize: 45,
        fontFamily: 'Bungee',
        stroke: 0xFFFFFF,
        strokeThickness: 4
    });
    
    startLabel1.x = 50;
    startLabel1.y = 120;
    startScene.addChild(startLabel1);
    
    let startLabel1Big = new PIXI.Text("Blast");
   startLabel1Big.style = new PIXI.TextStyle({
        fill: 0xb6ddff,
        fontSize: 60,
        fontFamily: 'Bungee',
        stroke: 0xFFFFFF,
        strokeThickness: 6
    });
    
    startLabel1Big.x = 150;
    startLabel1Big.y = 180;
    startScene.addChild(startLabel1Big);
    
    
    let startLabel2 = new PIXI.Text("Ready?")
    startLabel2.style = new PIXI.TextStyle({
        fill: 0xFFFFFF,
        fontSize: 40,
        fontFamily: 'Bungee',
        fontStyle: "italic",
        //stroke: 0xFF0000,
        //strokeThickness: 6
    });
    startLabel2.x = 160;
    startLabel2.y = 350;
    startScene.addChild(startLabel2);
    
    let startButton = new PIXI.Text("Start Game!");
    startButton.style = buttonStyle;
    startButton.x = 80;
    startButton.y = sceneHeight - 100;
    startButton.interactive = true;
    startButton.buttonMode = true;
    startButton.on("pointerup",startGame);
    startButton.on("pointerover",e=>e.target.alpha = 0.7);
    startButton.on("pointerout",e=>e.currentTarget.alpha = 1.0);
    startScene.addChild(startButton);
    
    let textStyle = new PIXI.TextStyle({
        fill: 0xb6ddff,
        fontSize: 35,
        fontFamily: "Bungee",
        stroke: 0xFFFFFF,
        strokeThickness: 4
    });
    scoreLabel = new PIXI.Text();
    scoreLabel.style = textStyle;
    scoreLabel.x = 10;
    scoreLabel.y = 25;
    gameScene.addChild(scoreLabel);
    increaseScoreBy(0);
    
    turnsLabel = new PIXI.Text();
    turnsLabel.style = textStyle;
    turnsLabel.x = 250;
    turnsLabel.y = 25;
    gameScene.addChild(turnsLabel);
    decreaseTurnsBy(0);
    
    // 3 - set up `gameOverScene`
    // 3A - make game over text
    let gameOverText = new PIXI.Text("Game Over!");
    gameOverScoreLabel = new PIXI.Text("replaced");
    gameOverHighScoreLabel = new PIXI.Text("replaced");
    textStyle = new PIXI.TextStyle({
        fill: 0xFFFFFF,
        fontSize: 64,
        fontFamily: "Bungee",
        stroke: 0xb6ddff,
        strokeThickness: 6
    });
    
    let scoreStyle = new PIXI.TextStyle({
        fill: 0xFFFFFF,
        fontSize: 25,
        fontFamily: "Bungee",
        //stroke: 0xFF0000,
        //strokeThickness: 6
    });
    gameOverText.style = textStyle;
    gameOverText.x = 50;
    gameOverText.y = sceneHeight/2 - 160;
    gameOverScene.addChild(gameOverText);
    
    
    gameOverScoreLabel.style = scoreStyle;
    gameOverScoreLabel.fontSize = 20;
    gameOverScoreLabel.x = 100;
    gameOverScoreLabel.y = sceneHeight/2 +50;
    gameOverScene.addChild(gameOverScoreLabel);
    
    gameOverHighScoreLabel.style = scoreStyle;
    gameOverHighScoreLabel.fontSize = 20;
    gameOverHighScoreLabel.x = 140;
    gameOverHighScoreLabel.y = sceneHeight/2 +100;
    gameOverScene.addChild(gameOverHighScoreLabel);


    // 3B - make "play again?" button
    let playAgainButton = new PIXI.Text("Play Again?");
    playAgainButton.style = buttonStyle;
    playAgainButton.x = 80;
    playAgainButton.y = sceneHeight - 100;
    playAgainButton.interactive = true;
    playAgainButton.buttonMode = true;
    playAgainButton.on("pointerup",startGame); // startGame is a function reference
    playAgainButton.on('pointerover',e=>e.target.alpha = 0.7); // concise arrow function with no brackets
    playAgainButton.on('pointerout',e=>e.currentTarget.alpha = 1.0); // ditto
    gameOverScene.addChild(playAgainButton);
}


//handles starting game and loading first level
function startGame(){
    startScene.visible = false;
    gameOverScene.visible = false;
    gameScene.visible = true;
    levelNum = 1;
    score = 0;
    turns = 10;
    increaseScoreBy(0);
    decreaseTurnsBy(0);
    loadLevel();
}

//increases score when bubble size increases
function increaseScoreBy(value){
    score += value;
    scoreLabel.text = `Score ${score}`;
}

//decreases number of turns player has
function decreaseTurnsBy(value){
    turns -= value;
    turns = parseInt(turns);
    turnsLabel.text = `Turns   ${turns}`;
}

//clears old level
//loads next level
function loadLevel(){
	//createCircles(levelNum * 5);
    dropletArray.forEach(d =>   gameScene.removeChild(d) );
    bubbles.forEach(b =>   gameScene.removeChild(b) );
    bubbles = [];
    dropletArray = [];
    Grid();
    Bubbles();
	paused = false;
}

//called when game ends
function end(){
    paused = true;
    gameOverScene.visible = true;
    gameScene.visible = false;
    
    if(score > storedHighScore || storedHighScore == null){
        storedHighScore = score;
       localStorage.setItem(nameKey, score);
       }
    gameOverScoreLabel.text = `Your Final Score:  ${score}`
    gameOverHighScoreLabel.text = `High Score:  ${storedHighScore}`
}


//draws grid for game
//all bubbbles are drawn on centered on these squares
function Grid() {
    for(let i = 0; i < grid.length; i++){
        grid[i] = new Array(5);
        
    }
    for(let i = 0; i < grid.length; i++){
        for(let j = 0; j < grid.length; j++){
            let rectangle=new PIXI.Graphics();
            rectangle.beginFill(0xbfb6e5);
            rectangle.drawRect(0,0,98,98);
            rectangle.x = i*100;
            rectangle.y =j*100;
            //rectangle.x += 200;
            rectangle.x += 2;
            rectangle.y +=100;
            grid[i][j]=rectangle;
            gameScene.addChild(grid[i][j]);

        }
    }
    
}

//draws bubbles at random locations + random sizes
//makes sure none overlap
//draws more based on level
function Bubbles() {
    
    let chance  = Math.ceil((levelNum * 10) /6 );
    let chancesArray = [];
    for(let t = 0; t < chance; t++){
        chancesArray[t] = Math.floor(getRandom(0,25));
        for(let i = 0; i<chancesArray.length; i++){
                 for(let j = 0; j<chancesArray.length; j++){
                     
                     if(i == j){
                         continue;
                     }
                     if(chancesArray[i] == chancesArray[j]){
                        chancesArray[j] = Math.floor(getRandom(0,25));
                }
            }
        }
    };
    chancesArray = Array.from(new Set(chancesArray));
    chance = chancesArray.length;
    bubbles = new Array(chance);
    for(let i = 0; i < chance; i++){
        let col = chancesArray[i]%5;
        let row = (chancesArray[i]-col)/5;
            let size = Math.ceil(getRandom(.5,3));
            let circle =new Circle(size * 15,size * 15, bubTex,col*100,row*100, size);
            circle.x += 50;
            circle.y += 150;
            
            bubbles.push(circle);
            gameScene.addChild(circle);
    }
    
}

//is used by the bubble being clicked
//spawns droplets from current bubble
function Explode(e) {
     shootSound.play();
    for(let i = 0; i < 4; i++){
        let droplets= new Droplet(dropTex,e.currentTarget.x, e.currentTarget.y, 1,0);
        gameScene.addChild(droplets);
        dropletArray.push(droplets);
        droplets= new Droplet(dropTex,e.currentTarget.x, e.currentTarget.y, -1,0);
        gameScene.addChild(droplets);
        dropletArray.push(droplets);
        droplets= new Droplet(dropTex,e.currentTarget.x, e.currentTarget.y, 0,1);
        gameScene.addChild(droplets);
        dropletArray.push(droplets);
        droplets= new Droplet(dropTex,e.currentTarget.x, e.currentTarget.y, 0,-1);
        gameScene.addChild(droplets);
        dropletArray.push(droplets);
    }
}

//is used by the bubble being collided with
//spawns droplets from current bubble
//if I have time I should find a way to reduce these Explode and ExplodeChain down to one method
function ExplodeChain(db) {
    shootSound.play();
    for(let i = 0; i < 4; i++){
        let droplets= new Droplet(dropTex,db.x, db.y, 1,0);
        gameScene.addChild(droplets);
        dropletArray.push(droplets);
        droplets= new Droplet(dropTex,db.x, db.y, -1,0);
        gameScene.addChild(droplets);
        dropletArray.push(droplets);
        droplets= new Droplet(dropTex,db.x, db.y, 0,1);
        gameScene.addChild(droplets);
        dropletArray.push(droplets);
        droplets= new Droplet(dropTex,db.x, db.y, 0,-1);
        gameScene.addChild(droplets);
        dropletArray.push(droplets);
    }
}

