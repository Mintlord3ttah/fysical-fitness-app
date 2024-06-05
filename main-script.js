'use strict'

const form = document.querySelector('.form');
// const done = document.querySelector('done')
// const cancel = document.querySelector('cancel')
const distanceInput = document.querySelector('.distance');
const durationInput = document.querySelector('.duration');
const elevationInput = document.getElementById('cycling-elevevation--levels')
const unitMeasure = document.querySelector('.unit-measure');
const btnOptions = document.querySelector('.btn-options') // sort order
const placeholder = document.querySelector('.placeholder');
const strengtInput = document.getElementById('level')
const dotsIcon = document.querySelector('.dots-icon');
const okayInput = document.getElementById('done')
const cancelForm = document.getElementById('cancel')
const info = document.querySelector('.info')
const body = document.querySelector('.body')
const workoutInputType = document.querySelector('.select');
const typeWorkout = document.getElementById('type')
const dashboard = document.querySelector('.bar');
const btn = document.querySelector('.close-dashboard');
const features = document.querySelector('.features');
const options = document.querySelector('.options');
const map = document.getElementById('map')
const themes = document.querySelector('.opt-ft');
const formBG = document.querySelector('.bg-color');
const infoText = document.querySelector('.info-text')

// sort order of list info

body.innerHTML = '';
let count = 0;

// CODE STRUCTURE

class Workout{
    #date = new Date(); // date of workout
    #id = (Date.now() + '').slice(-10); // unique id for each workout
    months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    timeStr = `${this.#date.getDate()}${this.#date.getMonth()}${this.#date.getHours()}${this.#date.getMinutes()}${this.#date.getSeconds()}`

    constructor(currentPosition, destination, level, duration, distance){
        this.currentPosition = currentPosition; // [lat, lng]
        this.destination = destination; // [lat, lng]
        this.distance = distance; // km
        this.level = level; // string
        this.duration = duration; // minutes
    
    }


   _descriptionMethod(){
    this.description = `${this.type[0].toUpperCase() + this.type.slice(1)} on ${this.months[this.#date.getMonth()]} ${this.#date.getDate()}`
    
    const html = `
    <div class='info ${this.type}-stripe' id='${this.#id}' data-date='${this.#date}' data-distance='${this.distance}' data-location='${this.destination}' data-duration='${this.duration}'>
    <div class="info-text">
    <span>${this.description}</span>
    <div class="features">
        <span class="btn-options"><ion-icon name="ellipsis-horizontal-outline" class ='dots-icon' title="my icon"></ion-icon></span>
       
        <ul class="options">
            <li class="edit">Edit</li>
            <li class="theme"><select name="theme" class="opt-ft">
                <option value="theme">Select theme</option>
                <option value="light-mode" class="light">Light theme</option>
                <option value="dark-mode" class="dark">Dark theme</option>
            </select></li>
            <li class="delete">Delete</li>
            <li class="delete-all">Delete all</li>
            <li><select name="sort" class="sort opt-ft">
                <option value="sort">Sort by</option>
                <option value="by-distance" class="sort-by--distance">distance</option>
                <option value="by-location" class="sort-by--location">location</option>
                <option value="by-duration" class="sort-by--duration">duration</option>
                <option value="by-date-modified" class="sort-by--date-modified">date modified</option>
            </select></li>
            <li class="view-all">View all workouts</li>
        </ul>
    </div>
    </div>
        <div class="info-data">
            <span class="distance">${this.avatar} ${this.distance.toFixed(1)}km</span>
            <span class="duration">⌚ ${this.duration.toFixed(1)}mins</span>
            <span class="cadence">⚡ ${this.type === 'running'? this.cadence.length > 1 ? `${this.cadence[0]} - ${this.cadence[1]}` + 'steps/min' : this.cadence[0] + 'steps/min' :
                                      this.elevation + 'gain'}</span>
            <span class="energy">${this.#date.getHours()} : ${`${this.#date.getMinutes()}`.padStart(2, 0)} : ${`${this.#date.getSeconds()}`.padStart(2, 0)}</span>
        </div>
        <div class="overflow">
            <span class="workout-count">${++count}</span>
        </div>
    </div>
    `;

    this.workoutInfo = html;
    body.insertAdjacentHTML('afterbegin', html)
    this.dateMonth = [`${this.#date.getDate()}${this.#date.getMonth()}${this.#date.getHours()}${this.#date.getMinutes()}${this.#date.getSeconds()}`.toString()]
   }

   getId(){
    return this.#id
   }
   _getDate(){
    return this.#date
   }
}

class Running extends Workout{
    
    type = 'running';
    constructor(currentPosition, destination, level, duration, distance, cadence){
        super(currentPosition, destination, level, duration, distance);
        this.cadence = cadence;
        this.avatar = '🏃‍♂️';
        
        this._pace();
        this._descriptionMethod()
    }

    _pace(){
        this.pace = this.duration / this.distance;
        return this.pace;
    }
}
class Cycling extends Workout{
    type = 'cycling';
    constructor(currentPosition, destination, level, duration, distance, elvation){
        super(currentPosition, destination, level, duration, distance);
        this.elevation = elvation;
        this.avatar = '🚴‍♀️';

        this._speed()
        this._descriptionMethod()
    }  
    
    _speed(){
        this.speed = this.distance / (this.duration / 60);
        return this.speed;
    }
}


