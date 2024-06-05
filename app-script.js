// handle class update
class UpdateClasses {
    constructor(element, className) {
        this.element = element
        this.className = className
    }

    classAdd() {
        this.element.classList.add(this.className)
    }
    classRemove() {
        this.element.classList.remove(this.className)
    }
    checkClass() {
        return this.element.classList.contains(this.className)
    }
    closestParent() {
        return this.element.closest(`.${this.className}`)
    }
}
// update classes in general
function initiateClasses(el, classes, add = true) {
    const anyObj = new UpdateClasses(el, classes)

    if (add) {
        anyObj.classAdd()
    }
    else {
        anyObj.classRemove()
    }
}
// inspect a class
function inspectClasses(el, classes, closest) {
    const anyObj = new UpdateClasses(el, classes)
    if (closest === 'close-parent') {
        return anyObj.closestParent()

    }
    else return anyObj.checkClass()
}

class App {
    #map;
    #mapEvent;
    #coords; // current position
    #coordinates; // destination
    #markersArr = [];
    #workOutArr = [];
    #workoutObj = [];
    #distance;
    #requestCancelForm = false;
    #edit = false;
    #levelstr;
    #marker;
    #localStoreUpload = true;
    #appCount = 0;

    constructor() {
        this._getPosition()
        this._getLocaleStore();
        this._mutatingElements();
        this._closeDashboard();
        body.addEventListener('click', this._options)
        body.addEventListener('click', this._optionsClick.bind(this));
        dashboard.addEventListener('click', this._dashboard.bind(this));
    }

    _getPosition() {
        navigator.geolocation.getCurrentPosition(
            this._loadMap.bind(this),
            (error) =>{
                alert(`${error.message}\nGeolocation is not supported by this browser.
                 \nHints: \n*Turn on location\n*Check your network provider`)
            },
            { enableHighAccuracy: true }
        )
    }

    _loadMap(position) {
        const { latitude, longitude } = position.coords
        this.#coords = [latitude, longitude]

        this.#map = L.map('map');
        if(this.#map) this.#map.setView(this.#coords, 13);

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);

        this.#map.on('click', this._showForm.bind(this));

        if (this.#workoutObj) {
            this.#workoutObj.forEach(w => {
                body.insertAdjacentHTML('afterbegin', w.workoutInfo);
                if(typeof w.destination === 'string'){
                    const d = w.destination.split(',').map(e => Number(e))
                    w.destination = d;
                }
                this._renderWorkoutOnMap(w)
            })
        }
    }

    _dashboard(e) {
        e.preventDefault()
        const done = inspectClasses(e.target, 'done')
        const cancel = inspectClasses(e.target, 'cancel')
        if (done) form.addEventListener('submit', this._newWorkout(e))  
        if(cancel) this._setForm(false)
        this._captureInfoEl(e)
    }
    _showForm(eventMap) {
        this.#mapEvent = eventMap;
        this.#requestCancelForm = false;
        this._getDestinationCoords();
        this._setForm();
        this.__haversineDistance(this.#coords, this.#coordinates)
        this._athleteLevel();
        this._removeForm();
        this._displayDashboard();
    }

    _setForm(display = true) {
        if (display) {
            distanceInput.value = durationInput.value = unitMeasure.value = '';

            form.classList.add('display-form')
            placeholder.style.height = '30rem';
            okayInput.focus()
        }
        else {
            form.classList.remove('display-form');
            placeholder.style.height = '10rem';
        }
    }

    _displayDashboard() {
        dashboard.classList.add('display-dashboard');
    }

    _removeForm() {
        cancelForm.addEventListener('click', () => this.#requestCancelForm = true)
    }

    _newWorkout(e) {
        let workout;

        // if workout running, create running object
        if (!this.#requestCancelForm || !this.editWorkout()) {
            if (workoutInputType.value === 'running') {
                this.#edit && this._deleteList(e)
                this.editWorkout()
                workout = new Running(this.#coords, this.#coordinates, this.#levelstr,
                    this.duration, this.#distance, this.cadence);

                // add new obect to the workout array
                this._workoutObject(workout);
                this._workoutExtraction(workout);

            }
            // if workout cycling, create cycling object
            else if (workoutInputType.value === 'cycling') {
                this.#edit && this._deleteList()
                this.editWorkout()
                workout = new Cycling(this.#coords, this.#coordinates, this.#levelstr,
                    this.duration, this.#distance, this.elevation);

                // add new obect to the workout array
                this._workoutObject(workout);
                this._workoutExtraction(workout);
            }
            // render workout on map and on the list
            (!this.#edit) && this._renderWorkoutOnMap(workout)
            this._localeStore(this.#workoutObj) // save workouts to browser storage
            this.#edit = false;
            this._setForm(false);
        }
        this._setForm(false);
    }

    _workoutObject(workout) {
        this.#workoutObj.push(workout)
    }

    _boilDownVal(valArr) {
        return valArr.reduce((acc, curr) => acc + curr, 0)
    }
    _workoutExtraction(workout) {
        const extraction = { work: workout.workoutInfo, distance: workout.distance, time: workout.timeStr, duration: workout.duration, location: workout.destination }
        this.#workOutArr.push(extraction)
    }

    __haversineDistance(pointA, pointB) { // get calculated #distance
        const toRad = (x) => x * Math.PI / 180;
        const R = 6371; // Earth's radius in km

        const dLat = toRad(pointB[0] - pointA[0]);
        const dLon = toRad(pointB[1] - pointA[1]);

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(pointA[0])) *
            Math.cos(toRad(pointB[0])) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        this.#distance = R * c;
        return this.#distance;
    }
    _getDestinationCoords() {
        const { lat, lng } = this.#mapEvent.latlng;
        this.#coordinates = [lat, lng]
    }

    _athleteLevel() {
        const gotInputType = workoutInputType.value
        let assume; // assumming bycicle is 10X faster 
        if (gotInputType === 'running') {
            const runningLevels = { // cadence
                'elite': [4, 180],
                'competetive': [5, 180],
                'moderate': [6, 160, 180],
                'beginner': [7, 160],
                'casual': [8, 160],
            }

            this._mutateFormFields(gotInputType)
            const level = strengtInput.value;
            this.#levelstr = level
            this.level = runningLevels[level][0];
            this.cadence = runningLevels[level].slice(1);
            assume = 1;

            unitMeasure.value = this.cadence.length > 1 ? `${this.cadence[0]} - ${this.cadence[1]}` : this.cadence[0]
        }
        if (gotInputType === 'cycling') {
            const cyclingLevels = { // elevation gains
                'flat-terrain': '0 - 100',
                'rolling-hills': '100 - 500',
                'hilly-terrain': '500 - 1000',
                'mountainous-terrain': '1000+',
            }
            this._mutateFormFields(gotInputType);
            const elevationLevel = elevationInput.value
            this.elevation = cyclingLevels[elevationLevel]
            unitMeasure.value = cyclingLevels[elevationLevel];
            assume = 5;
        }
        else if (gotInputType !== 'running' && gotInputType !== 'cycling') alert('Feature not available yet!');

        this.duration = (this.level * this.#distance) / assume; // min
        distanceInput.value = this.#distance.toFixed(3) + "km";
        const template = this.duration > 60 ? `${(this.duration / 60).toFixed(1)}hrs` : `${this.duration.toFixed(1)}mins`
        durationInput.value = template;
    }

    _readOnly(e) {
        const t = e.target.classList.contains('read-only--data');
        if (t) { e.target.readOnly = true; alert("This field is an auto-filled data learned from statistics and can only be read") }
    }
    _renderWorkoutOnMap(workout) {
        this.#marker = L.marker(workout.destination)
        this.#marker.addTo(this.#map)
            .bindPopup(L.popup({
                minWidth: 150,
                maxWidth: 100,
                autoClose: false,
                closeOnClick: false,
                className: `${workout.type}-stripe popup`,
            }))
            .setPopupContent(workout.description)
            .openPopup();
        this.#markersArr.push(this.#marker)
    }
    _mutateFormFields(type) {
        const activityLevel = document.querySelector('.changing-label--level')
        const unitName = document.querySelector('.changing-label--unit-measure')

        if (type === 'running') {
            activityLevel.textContent = "Level";
            unitName.textContent = "Cadence";
            elevationInput.style.display = 'none';
            strengtInput.style.display = 'block'
        }
        else if (type === 'cycling') {
            activityLevel.textContent = "Difficulty";
            unitName.textContent = "Elevation";
            elevationInput.style.display = 'block';
            strengtInput.style.display = 'none';
        }
    }
    _mutatingElements() {
        const choiceEl = document.querySelectorAll('.select');
        choiceEl.forEach(el => el.addEventListener('change', this._athleteLevel.bind(this)))
    }
    _closeDashboard() {
        btn.addEventListener('click', function () {
            dashboard.classList.remove("display-dashboard")
        })
    }
    _disableClass() {
        body.addEventListener('click', function (e) {
            const targetEl = document.querySelectorAll('.options');
            targetEl.forEach(el => {
                el.removeEventlister('mouseover')
                el.classList.remove('display-options')
            })
        })
    }

    _backgroundCl(els, str) {
        els.forEach(el => el.style.backgroundColor = str)
    }

    _updateLocalStore(wait = true){
        const obj = this.#workoutObj.findIndex(el => el.location === this.#coordinates);

        this.#workoutObj.splice(obj, 1)
        if(wait) this._localeStore(this.#workoutObj)
    }

    _optionsClick(e) {
        const elBG = [map, dashboard, formBG]

        const edit = inspectClasses(e.target, 'edit');
        const deletebtn = inspectClasses(e.target, 'delete');
        const deleteAllbtn = inspectClasses(e.target, 'delete-all');
        const viewAll = inspectClasses(e.target, 'view-all');

        if (e.target.closest('.info')) {
            const target = e.target.closest('.info')
            const theme = target.querySelector('.opt-ft')
            if (theme.value === 'light-mode') {
                this._backgroundCl(elBG, '#f1f1f1')
            }
            else if (theme.value === 'dark-mode') {
                this._backgroundCl(elBG, '#212122')
            }
            // this.finishedClick(e)
        }
        if (edit) {
            this.#edit = edit;
            this._setForm();
        }
        if (deletebtn) {
            if (confirm('are you sure you want to delete this?')) {
                this._delete(e, true);

                this._updateLocalStore()
               
            }
        }
        if (deleteAllbtn) {
            if (confirm('are you sure you want to delete all workouts?')) {
                body.innerHTML = '';
                this.#markersArr.forEach(marker => {
                    this.#map.removeLayer(marker)
                })
                this._reset()
                // this.finishedClick(e)
            }
        }
        if (!this.#edit) this._moveToMarker(e) // move to marker from list click

        if (inspectClasses(e.target, 'sort')) {
            this._sortList(e)
        }
        if (viewAll) {
            // Create a feature group and add the markers
            const group = L.featureGroup(this.#markersArr);

            // Get the bounds of the group
            const bounds = group.getBounds();

            // Fit the map to the bounds
            this.#map.fitBounds(bounds);
        }
    }
    rearrangeHtml() {
        body.innerHTML = '';
        this.#workOutArr.forEach(item => body.insertAdjacentHTML('afterbegin', item.work))
    }
    _sortList(e) {
        const sort = e.target.value;

        if (sort === 'by-distance') {
            this.#workOutArr.sort((a, b) => b.distance - a.distance)
            this.rearrangeHtml();
        }
        if (sort === 'by-duration') {
            this.#workOutArr.sort((a, b) => b.duration - a.duration)
            this.rearrangeHtml();
        }
        if (sort === 'by-date-modified') {
            this.#workOutArr.sort((a, b) => b.time - a.time)
            this.rearrangeHtml();
        }
        if (sort === 'by-location') {
            this.#workOutArr.sort((a, b) => b.location - a.location)
            this.rearrangeHtml();
        }
        // this.finishedClick(e)
    }

    _delete(e, deleteMarker = false) {
        inspectClasses(e.target, 'info', 'close-parent').remove()
        if (deleteMarker) this.#map.removeLayer(this.#marker)
    }

    _moveToMarker(e) {
        const closestInfo = inspectClasses(e.target, 'info', 'close-parent');
        const refinedNumb = closestInfo.dataset.location.split(',').map(each => Number(each))
        this.#map.setView(refinedNumb, 13)
    }
    validateInput(...inputs) {
        const inputsArr = [...inputs]
        return inputsArr.every(value => Number.isFinite(value))
    }
    antiNullInput(...inputs){
        const inputsArr = [...inputs]
        return inputsArr.every(value => value > 0)
    }
    _captureInfoEl(e){
        if(inspectClasses(e.target, 'info', 'close-parent')){
        const info = inspectClasses(e.target, 'info', 'close-parent')
        const infoId = info.getAttribute('id');
        const captLocation = info.dataset.location
        this.capturedInfo = info;
        this.capturedInfoId = infoId;
        this.#coordinates = captLocation;

    }}
    
    _deleteList() {
        this._updateLocalStore(false)
        this.capturedInfo.remove()
    }
    editWorkout() {
        const getDistance = +distanceInput.value
        const getDuration = +durationInput.value
        const getUnitMeasure = +unitMeasure.value

        const readyInputs = this.validateInput(getDistance, getDuration, getUnitMeasure)
        const antiNull = this.antiNullInput(getDistance, getDuration, getUnitMeasure)

        if (readyInputs && antiNull) {
            this.#distance = getDistance;
            this.duration = getDuration;
            this.cadence = [getUnitMeasure];
            this.elevation = getUnitMeasure;
        }
    }

    _options(e) {
        if (e.target.closest('.btn-options')) {
            const options = e.target.closest('.info').querySelector('.options');
            options.classList.toggle('display-options');

            options.addEventListener('mouseleave', function () {
                initiateClasses(options, 'display-options', false)
            })
        }
    }
    finishedClick(e) {
        const options = e.target.closest('.info').querySelector('.options');
        initiateClasses(options, 'display-options', false)
    }

    _localeStore(arr) {
        localStorage.setItem('workouts', JSON.stringify(arr))
    }
    _getLocaleStore() {
        const localData = localStorage.getItem('workouts')
        if (!localData) return
        const parsed = JSON.parse(localData)
        this.#workoutObj = parsed;

    }

    _reset() {
        localStorage.removeItem('workouts');
        location.reload()
    }
}

const app = new App();
