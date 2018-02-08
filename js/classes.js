//class for creation of circles which act as bubbles in the game
class Circle extends PIXI.Sprite{
    constructor(width = 7.5, height = 7.5, texture = bubTex, x=0, y=0, size =1){
        super();
        PIXI.Sprite.call(this, texture);
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        //this.radius = radius;
        this.isAlive = true;
        this.anchor.x = .5;
        this.anchor.y = .5;
        this.size = size;
        this.interactive = true;
        this.buttonMode = true;
        this.explodeTrigger = false;
        this.on("pointerover",e=>e.target.alpha = 0.3);
        this.on("pointerout",e=>e.currentTarget.alpha = 1.0);
        this.on("pointerup", function (e) {
                decreaseTurnsBy(1);
                if(e.currentTarget.size == 3){
                gameScene.removeChild(e.currentTarget);
                bubbles.splice(bubbles.indexOf(e.currentTarget),1);
                this.explodeTrigger = false;
                Explode(e);
                    
                }
                else{
                    hitSound.play();
                    e.currentTarget.size += 1;
                    let spawn =new Circle(e.currentTarget.size * 15,e.currentTarget.size * 15, bubTex,e.currentTarget.x,e.currentTarget.y, e.currentTarget.size);
                    gameScene.removeChild(e.currentTarget);
                    e.currentTarget.isAlive = false;
                    //bubbles.splice(bubbles.indexOf(e.currentTarget),1, spawn);
                    bubAdd.push(spawn);
                    gameScene.addChild(spawn);
                
                }
            });
        
    }
    
}

//class for creation of droplets, they act as bullets
class Droplet extends PIXI.Sprite{
    constructor(texture = dropTex, x=0, y=0, par1,par2){
        super();
        PIXI.Sprite.call(this, texture);
        this.x = x;
        this.y = y;
        this.anchor.x = .5;
        this.anchor.y = .5;
        this.width = 30;
        this.height = 30;
        this.fwd = {x:par1,y:par2};
        this.speed = 200;
        this.isAlive = true;
        Object.seal(this);
    }
    move(dt=1/60){
        this.x += this.fwd.x * this.speed * dt;
        this.y += this.fwd.y * this.speed * dt;
    }
}