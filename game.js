//defining some globals (a bit redundant)
var width = 320,
    height = 320,
    gLoop,
    score = 0,
    state = false,
    maxSpeed = 3,
    balls = new Array(),
    ballLimit = 30,
    ballImage = new Image(),
    playerImage = new Image(),
    c = document.getElementById('c'),
    ctx = c.getContext('2d');

//Load textures
ballImage.src = "boulders.png";
playerImage.src = "player.png";

//set canvas size
c.width = width;
c.height = height;

//Generate background pattern (64x64)
var pattern = document.createElement('canvas');
pattern.width = 64;
pattern.height = 64;
var pctx = pattern.getContext('2d');

pctx.fillStyle = 'rgb(0,0,0)';
pctx.beginPath();
pctx.rect(0,0,64,64);
pctx.closePath();
pctx.fill();

for(var w=0; w<=64; w++)
{
    for(var h=0; h<=64; h++)
    {
        randR = Math.floor(Math.random()*30) + 70;
        randG = Math.floor(Math.random()*20) + 40;
        randB = Math.floor(Math.random()*10) + 30;
        alpha = Math.random()*0.3 +0.7;

        pctx.fillStyle = 'rgba('+randR+','+randG+','+randB+','+alpha+')';
        pctx.beginPath();
        pctx.rect(w,h,1,1);
        pctx.closePath();
        pctx.fill();
    }
}

var background = ctx.createPattern(pattern, "repeat");

//Fill the canvas with background pattern
var clear = function()
{

    ctx.fillStyle = background;
    ctx.beginPath();
    ctx.rect(0,0,width,height);
    ctx.closePath();
    ctx.fill();
};

//Create player object with anon function
var Player = new(function()
{
    var p = this;

    //attributes
    p.size = 8;
    p.X = 0;
    p.Y = 0;
    p.moveU = false;
    p.moveD = false;
    p.moveL = false;
    p.moveR = false;
    p.speed = 3;
    p.interval = 0;
    p.frame = 0;
    p.frameCount = 6;
    p.frameDelay = 0;
    p.frameDelayLimit = 12;
    p.facing = 0;

    //methods
    p.setPosition = function(x,y)
    {
        p.X = x;
        p.Y = y;
    }

    p.draw = function()
    {
        //Delay frame drawing
        if(p.frameDelay >= p.frameDelayLimit)
        {
            p.frameDelay = 0;

            p.frame++;
            if(p.frame >= p.frameCount)
                p.frame = 0;
        }

                try {
            ctx.drawImage(playerImage,p.facing*p.size,p.frame*p.size,p.size,p.size,
                                      p.X,p.Y,p.size,p.size);
        } catch(e){}
    }

    p.move = function()
    {

        while(p.interval < p.speed)
        {
            p.interval++;

            //Up and down movement
            if(p.moveU && !p.moveD && p.Y > 0)
                p.Y--;
            else if(p.moveD && !p.moveU && p.Y+p.size < height)
                p.Y++;

            //Left and righet movement
            if(p.moveL && !p.moveR && p.X > 0)
                p.X--;
            else if(p.moveR && !p.moveL && p.X+p.size < width)
                p.X++;

        }
        p.interval = 0;

        //Moving makes frames tick
        if(p.moveU || p.moveD || p.moveR || p.moveL)
            p.frameDelay++;

        //Determine facing
        //Going up or down but not sideways
        if( ( (p.moveU && !p.moveD) || (!p.moveU && p.moveD ) ) && !(p.moveL || p.moveR))
            p.facing = 0;
        //Going left or right but not up or down
        else if( ( (p.moveR && !p.moveL) || (!p.moveR && p.moveL ) ) && !(p.moveU || p.moveD))
            p.facing = 1;
        //Going crossways
        else if( ( (p.moveU && !p.moveD) || (!p.moveU && p.moveD) ) &&( (p.moveR && !p.moveL) || (!p.moveR && p.moveL) ) )
            p.facing = 2;

    }
})();

function Ball() {

    var b = this;

    b.size = 10;
    b.X = Math.floor(width/2 - b.size/2);
    b.Y = Math.floor(height/4 - b.size/2);
    b.dirX = 0;
    b.dirY = 0;;
    b.speedX = 5;
    b.speedY = 5;
    b.intervalX = 0;
    b.inervalY = 0;
    b.frame = 0;
    b.frameDelay = 0;
    b.frameDelayLimit = 10;

    b.setPos = function(x,y)
    {
        b.X = x;
        b.Y = y;
    };

    b.setDir = function(dX, dY)
    {
        b.dirX = dX;
        b.dirY = dY;
    };

    b.setSpeed = function(sX, sY)
    {
        b.speedX = sX;
        b.speedY = sY;
    };

    b.move = function()
    {
        while(b.intervalX < b.speedX || b.intervalY < b.speedY)
        {
            //Move horizontal
            if(b.intervalX < b.speedX)
            {
                if(b.dirX < 0 && b.X > 0)
                    b.X += b.dirX;
                if(b.dirX > 0 && b.X+b.size < width)
                    b.X += b.dirX;

                b.intervalX++;
            }

            //Move vertical
            if(b.intervalY < b.speedY)
            {
                if(b.dirY < 0 && b.Y > 0)
                    b.Y += b.dirY;
                if(b.dirY > 0 && b.Y+b.size < height)
                    b.Y += b.dirY;

                b.intervalY++;
            }

            //Check collision with player
            if((b.X + b.size >= Player.X && b.X <= Player.X + Player.size)
            && (b.Y + b.size >= Player.Y && b.Y <= Player.Y + Player.size))
                GameOver();

            //Check collision to walls
            if(b.X <= 0 && b.dirX < 0)
            {
                b.dirX *= -1;
                b.dirY = Math.floor(Math.random()*2) - 1;
                b.speedY = Math.floor(Math.random()*maxSpeed) + 1;
                score += 1;

                //Chance to duplicate
                if(Math.random()*balls.length < 1 && balls.length < ballLimit)
                {
                    addBall(b.X,b.Y,b.dirX,Math.floor(Math.random()*2) - 1);
                }
            }
            if(b.X+b.size >= width && b.dirX > 0)
            {
                b.dirX *= -1;
                b.dirY = Math.floor(Math.random()*2) - 1;
                b.speedY = Math.floor(Math.random()*maxSpeed) + 1;
                score += 1;

                //Chance to duplicate
                if(Math.random()*balls.length < 1 && balls.length < ballLimit)
                {
                    addBall(b.X,b.Y,b.dirX,Math.floor(Math.random()*2) - 1);
                }
            }

            if(b.Y <= 0 && b.dirY < 0)
            {
                b.dirY *= -1;
                b.dirX = Math.floor(Math.random()*2) - 1;
                b.speedX = Math.floor(Math.random()*maxSpeed) + 1;
                score += 1;

                //Chance to duplicate
                if(Math.random()*balls.length < 1 && balls.length < ballLimit)
                {
                    addBall(b.X,b.Y,Math.floor(Math.random()*2) - 1,b.dirY);
                }
            }
            if(b.Y+b.size >= height && b.dirY > 0)
            {
                b.dirY *= -1;
                b.dirX = Math.floor(Math.random()*2) - 1;
                b.speedX = Math.floor(Math.random()*maxSpeed) + 1;
                score += 1;
                
                //Chance to duplicate
                if(Math.random()*balls.length < 1 && balls.length < ballLimit)
                {
                    addBall(b.X,b.Y,Math.floor(Math.random()*2) - 1,b.dirY);
                }
            }
        }
        b.intervalX = 0;
        b.intervalY = 0;

        //Speed affects animation also
        if(b.speedX+b.speedY<maxSpeed/2)
            b.frameDelayLimit = 14;
        else if(b.speedX+b.speedY<maxSpeed)
            b.frameDelayLimit = 12;
        else if(b.speedX+b.speedY<2*maxSpeed/3)
            b.frameDelayLimit = 10;
        else
            b.frameDelayLimit = 8;


    };

    b.draw = function()
    {
        //Slow down the animation
        b.frameDelay++;
        if(b.frameDelay >= b.frameDelayLimit)
        {
            b.frameDelay = 0;
            if(b.frame != 0) b.frame = 0;
            else b.frame = 1;
        }

        try {
            //Image, cut from, cut to, place to and size
            ctx.drawImage(ballImage,0,b.frame*b.size,b.size,b.size,
                                  b.X,b.Y,b.size,b.size);
        } catch(e) {}

    };
}

function addBall(posX,posY,dirX,dirY)
{
    balls[balls.length] = new Ball();
    balls[balls.length-1].setPos(posX,posY);
    balls[balls.length-1].setDir(dirX,dirY);
    balls[balls.length-1].setSpeed(Math.floor(Math.random()*maxSpeed) + 1,
                                   Math.floor(Math.random()*maxSpeed) + 1);
}

function keyDown(ev)
{
    switch(ev.keyCode)
    {
        case 37: //Left arrow
            Player.moveL = true;
            break;
        case 38: //Up arrow
            Player.moveU = true;
            break;
        case 39: //Down arrow
            Player.moveR = true;
            break;
        case 40: //Right arrow
            Player.moveD = true;
            break;
        default:
            break;
    }
}

function keyUp(ev)
{
    switch(ev.keyCode)
    {
        case 37: //Left arrow
            Player.moveL = false;
            break;
        case 38: //Up arrow
            Player.moveU = false;
            break;
        case 39: //Down arrow
            Player.moveR = false;
            break;
        case 40: //Right arrow
            Player.moveD = false;
            break;
        case 32: //Space bar
            if(!state)
                startGame();
            break;
        default:
            break;
    }
}

function startScreen()
{
    clear();
    ctx.fillStyle = "Red";
    ctx.font = "10pt Arial";
    ctx.fillText("Your objective is to dodge", width / 2 - 70, height / 2 - 90);
    ctx.fillText("rocks as long as possible.", width / 2 - 70, height / 2 - 70);
    ctx.fillText("Good luck.", width / 2 - 25, height / 2 - 50);
    ctx.fillText("Use arrow keys to move.", width / 2 - 70, height / 2 - 10);
    ctx.fillText("Press space to start game.", width / 2 - 70, height / 2 + 10);
}

function GameOver()
{
    //Stop runloop
    state = false;
    clearTimeout(gLoop);

    //Queue GameOver frame
    setTimeout(function()
    {
        clear();
        ctx.fillStyle = "Red";
        ctx.font = "10pt Arial";
        ctx.fillText("GAME OVER", width / 2 - 40, height / 2 - 50);
        ctx.fillText("YOUR RESULT: " + score, width / 2 - 50, height / 2 - 30);
        ctx.fillText("Press space to play again.", width / 2 - 70, height / 2 + 10);
    }, 100)
}

function init()
{
    Player.setPosition(~~(width/2 - Player.size/2),~~(height/2 - Player.size/2));
    Player.facing = 0;
    balls.length = 0;
    balls[0] = new Ball();
    balls[0].setDir(1,-1);
    balls[0].setSpeed(2,5);
    score = 0;
}

//Main loop
var GameLoop = function()
{
    //Clear the old frame
    clear();

    Player.draw();
    for(var i = 0; i < balls.length; i++)
        balls[i].draw();

    Player.move();
    for(var i = 0; i < balls.length; i++)
        balls[i].move();

    ctx.fillStyle = "White";
    ctx.fillText("SCORE " + score, 10,10);
    //ctx.fillText("DEBUG " + Player.frameDelay, 10,40);
    //~50 FPS, frame is called 20ms after
    //the one before it has finished
    if(state)
        gLoop = setTimeout(GameLoop, 1000/50);
};

//add listener for keyup and keydown
window.addEventListener('keydown',keyDown,true);
window.addEventListener('keyup',keyUp,true);

//Start game
function startGame()
{
    state = true;
    init();
    GameLoop();
}

startScreen();
