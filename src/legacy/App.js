import React, { Component } from "react";
import ReactDOM from "react-dom";
import { hot } from "react-hot-loader";
import GoogleMapReact from 'google-map-react';
import "./App.css";
var infowindow;
var selfMarker;

const AnyReactComponent = ({ text }) => <div style={{ width: 'max-content' , backgroundColor:"white" , borderRadius:"3em", border:"3px solid red"}} >{text}</div>;
const CafeMarker = ({ icon, key, map, lat, lng, target, mapApi, placeId}) => {

    const handleClick = () => {

        const detailService = new mapApi.places.PlacesService(map)
        const request = {
            placeId: placeId,
            ffields: ['name',
                'formatted_address',
                'formatted_phone_number',
                'opening_hours',
            ]
        }
        detailService.getDetails(request, (results, status) => {
            if (status === mapApi.places.PlacesServiceStatus.OK) {
                var contentString = 
                    '<div id="content">' +
                    '店名:' + target.name +
                    '</div>' +
                    '<div id="content">' +
                    '距離:' + target.travel.distance.text +
                    '</div>' +
                    '<div id="content">' +
                    '星數:' + target.rating +
                    '</div>' +
                    '<div id="content">' +
                    '價格:' + target.price_level +
                    '</div>'+
                    '<div id="content">' +
                    '地址:' + results.formatted_phone_number +
                    '</div>' +
                    '<div id="content">' +
                    '營業時間:' +
                    '</div>' +
                    '<div id="content">' +
                    results.opening_hours.weekday_text[0] +
                    '</div>' +
                    '<div id="content">' +
                    results.opening_hours.weekday_text[1] +
                    '</div>' +
                    '<div id="content">' +
                    results.opening_hours.weekday_text[2] +
                    '</div>' +
                    '<div id="content">' +
                    results.opening_hours.weekday_text[3] +
                    '</div>' +
                    '<div id="content">' +
                    results.opening_hours.weekday_text[4] +
                    '</div>' +
                    '<div id="content">' +
                    results.opening_hours.weekday_text[5] +
                    '</div>' +
                    '<div id="content">' +
                    results.opening_hours.weekday_text[6] +
                    '</div>' ;
                
                
                infowindow.setPosition({ lat: lat, lng: lng });
                infowindow.setContent(contentString);
                infowindow.open(map);
            }
        })
        
    };
    
    return (
        <div key={key}>
            <img style={{ height: '20px', width: '20px' }} src={icon} />
            <div className={"trigger"}>
                <div className={"markerText"} style={{ width: ' max-content', borderRadius: "3em", border: "3px solid yellow" }} onClick={handleClick}>{target.name}</div>
            </div>
        </div>
    );
}

class SimpleMap extends Component {

    constructor(props) {
        super(props)
        this.state = {
            center: {
                lat: 24.9868366,
                lng: 121.5108634
            },
            zoom:17,
            mapApiLoaded:false,
            mapInstance:null,
            mapApi: null,
            travelType: "WALKING",
            places:[]
        }
        this.handleChange = this.handleChange.bind(this)
        this.handleApiLoaded = this.handleApiLoaded.bind(this)
        this.sort = this.sort.bind(this)
        this.travel = this.travel.bind(this)
        
    }
    handleChange(){
        if (this.state.mapApiLoaded) {
            // const service = new mapApi.places.AutocompleteService()
            // const request = {
            //     input: '台北市大同區'
            // }

            // service.getPlacePredictions(request, results => {
            //     console.log(results)
            // });
            // selfMarker.setMap(null)
            this.setState({
                ["center"]: {
                    lat: this.state.mapInstance.center.lat(),
                    lng: this.state.mapInstance.center.lng()
                }
            })
            selfMarker = new (this.state.mapApi).Marker({
                position: this.state.center,
                map: this.state.mapInstance,
                title: 'Hello World!'
            })




            const searchService = new google.maps.places.PlacesService(this.state.mapInstance)
            const distService = new google.maps.DistanceMatrixService()
            const searchRequest = {
                location: this.state.center,
                radius: 1000,
                type: ['restaurant']
            }
            searchService.nearbySearch(searchRequest, (results, status) => {
                if (status === this.state.mapApi.places.PlacesServiceStatus.OK) {

                    let target = []
                    results.map(item => {
                        target.push({ lat: item.geometry.location.lat(), lng: item.geometry.location.lng() })
                    })
                    let distRequest = {
                        origins: [ this.state.center ],
                        destinations: target,
                        travelMode: this.state.travelType,
                        unitSystem: google.maps.UnitSystem.METRIC,
                    }
                    distService.getDistanceMatrix(distRequest, function (response, status) {
                        if (status !== google.maps.DistanceMatrixStatus.OK) {

                            window.alert('Error was' + status);

                        } else {

                            results.map((item,index) => {
                                item.travel = response.rows[0].elements[index]
                            })

                            this.setState({ ["places"]: results })
                            ReactDOM.render(<RestaurantList data={this.state.places} />, document.getElementById("restaurantList"));
                            
                        }
                    }.bind(this))
                }
            })

            infowindow.close();
        }
    }
    handleApiLoaded(map, maps) {
        this.setState({ ["mapInstance"]: map })
        this.setState({ ["mapApi"]: maps })
        this.setState({ ["mapApiLoaded"]: true })

        const addressInput = document.createElement("div");
        addressInput.style.backgroundColor = 'white';
        addressInput.style.width = 'max-content';
        addressInput.style.margin = '10px';
        addressInput.classList.add("flexColumn");

        const inputData = document.createElement("div");
        inputData.style.flexBasis = '10px';
        inputData.style.flexGrow = '0';
        inputData.classList.add("flexRow");

        const inputTitle = document.createElement("div");
        inputTitle.textContent = '地址';
        const input = document.createElement("input");
        input.type = 'text';

        const resultAddress = document.createElement("div");
        resultAddress.style.flexGrow = '1';
        resultAddress.style.flexBasis = '0px';
        resultAddress.style.width = 'max-content';
        resultAddress.classList.add("flexColumn");
        resultAddress.id="resultAddress"
        inputData.appendChild(inputTitle);
        inputData.appendChild(input);
        addressInput.appendChild(inputData);
        addressInput.appendChild(resultAddress);


        const restaurantListContainer = document.createElement("div");
        restaurantListContainer.style.height = '30%';
        restaurantListContainer.style.width = '30%';
        restaurantListContainer.style.margin = '10px';
        restaurantListContainer.style.opacity = '0.8';
        restaurantListContainer.style.backgroundColor = '#FFD306';
        restaurantListContainer.classList.add("flexColumn");
        const restaurantList = document.createElement("div");
        restaurantList.style.width = '100%';
        restaurantList.classList.add("scrollbar");
        restaurantList.classList.add("scrollbar-primary");
        restaurantList.classList.add("restaurantList");
        restaurantList.id ="restaurantList"

        restaurantListContainer.appendChild(restaurantList);

        
        const selectTravelOptionContainer= document.createElement("div");
        selectTravelOptionContainer.textContent = "交通方式";
        selectTravelOptionContainer.style.fontSize = "large";
        const selectTravelOption = document.createElement("select");
        selectTravelOption.classList.add("custom-select");
        selectTravelOption.classList.add("mr-sm-2");
        selectTravelOption.style.width="200px";
        const walkOption = document.createElement("option");
        walkOption.textContent = "WALKING";
        const driveOption = document.createElement("option");
        driveOption.textContent = "DRIVING";
        const transitOption = document.createElement("option");
        transitOption.textContent = "TRANSIT"; 
        const bicyclingOption = document.createElement("option");
        bicyclingOption.textContent = "BICYCLING";

        selectTravelOption.appendChild(walkOption);
        selectTravelOption.appendChild(driveOption);
        selectTravelOption.appendChild(transitOption);
        selectTravelOption.appendChild(bicyclingOption);
        
        selectTravelOptionContainer.appendChild(selectTravelOption);
        selectTravelOption.addEventListener("change", (event) => {
            this.travel(event.target.value)
        })


        const SortOptionContainer = document.createElement("div");
        SortOptionContainer.textContent = "排列方式";
        SortOptionContainer.style.fontSize = "large";
        const selectSortOption = document.createElement("select");
        selectSortOption.classList.add("custom-select");
        selectSortOption.classList.add("mr-sm-2");
        selectSortOption.style.width = "200px";
        const sortByNameOption = document.createElement("option");
        sortByNameOption.textContent = "Name";
        const sortByStarOption = document.createElement("option");
        sortByStarOption.textContent = "Star";
        const sortByDistOption = document.createElement("option");
        sortByDistOption.textContent = "Dist";
        const sortByTimeOption = document.createElement("option");
        sortByTimeOption.textContent = "Time";

        selectSortOption.addEventListener("change", (event) => {
            this.sort(event.target.value)
        })

        selectSortOption.appendChild(sortByNameOption);
        selectSortOption.appendChild(sortByStarOption);
        selectSortOption.appendChild(sortByDistOption);
        selectSortOption.appendChild(sortByTimeOption);
        SortOptionContainer.appendChild(selectSortOption);

        map.controls[google.maps.ControlPosition.RIGHT_CENTER].push(SortOptionContainer);
        map.controls[google.maps.ControlPosition.RIGHT_CENTER].push(selectTravelOptionContainer);
        map.controls[google.maps.ControlPosition.RIGHT_CENTER].push(restaurantListContainer);
        map.controls[google.maps.ControlPosition.TOP_LEFT].push(addressInput);
        


        selfMarker = new (this.state.mapApi).Marker({
            position: this.state.center,
            map: this.state.mapInstance,
            title: 'Hello World!'
        })



        infowindow = new google.maps.InfoWindow()
        // this.handleChange()
    }
    sort(type){
        switch(type){
            case "Star":
                this.setState({ ["places"]: this.state.places.sort(function (a, b) { return b.rating - a.rating }) })
                break;
            case "Name":
                this.setState({ ["places"]: this.state.places.sort(function (a, b) { return (a.name).localeCompare(b.name); }) })
                break;  
            case "Dist":
                this.setState({ ["places"]: this.state.places.sort(function (a, b) { return a.travel.distance.value - b.travel.distance.value }) })
                break;
            case "Time":
                break;  
        }
        ReactDOM.render(<RestaurantList data={this.state.places} />, document.getElementById("restaurantList"));

    }
    travel(type) {
        this.setState({ ["travelType"]: type})
        this.handleChange()
    }
    render() {
        return (
            <div style={{height:'95vh', width:'100%'}}>
                <GoogleMapReact
                    bootstrapURLKeys={{
                        key: 'AIzaSyBtC09sTlkWfAr4InVsEgpdGrli5PvhG8w',
                        libraries: ['places']}}
                    center={this.state.center}
                    zoom={this.state.zoom}
                    yesIWantToUseGoogleMapApiInternals 
                    onChange={this.handleChange}
                    onGoogleApiLoaded={({ map, maps }) => this.handleApiLoaded(map, maps)}>

                    <AnyReactComponent
                        lat={this.state.center.lat}
                        lng={this.state.center.lng}
                        text="My Place"/>

                    {this.state.places.map((item, index) => (
                        <CafeMarker
                            icon={item.icon}
                            key={index}
                            lat={item.geometry.location.lat()}
                            lng={item.geometry.location.lng()}
                            target={item}
                            placeId={item.place_id}
                            map={this.state.mapInstance}
                            mapApi={this.state.mapApi}
                        />
                    ))}

                </GoogleMapReact>
            </div>
        );
    }
}
class RestaurantList extends Component {

    constructor(props) {
        super(props)
        this.state = {
            restaurantList :this.props.data
        }
    }
    shouldComponentUpdate(nextProps) {

        this.state.restaurantList = nextProps.data
        return true
    }
    render() {
        const restaurant = []
        for (var num = 0; num < this.state.restaurantList.length;num++){
            restaurant.push(<div className="restaurantContainer flexRow" style={{width: '100%' }} key={this.state.restaurantList[num].place_id}>
                                <div className="messageContainer flexColumn">
                                    <div className="restaurantName">店家名稱:{this.state.restaurantList[num].name}</div>
                                    <div className="restaurantMessage">地址:{this.state.restaurantList[num].vicinity}</div>
                                    <div className="restaurantRate">評價:{this.state.restaurantList[num].rating}</div>
                                    <div className="restaurantDist">距離:{this.state.restaurantList[num].travel.distance.text}</div>
                                    <div className="restaurantTime">預計抵達時間:{this.state.restaurantList[num].travel.duration.text}</div>
                                </div>
                                <div className="buttonContainer flexColumn">
                                    <input type="button" value="找咖啡廳" />
                                    <input type="button" value="找咖啡廳" />
                                    <input type="button" value="找咖啡廳" />
                                </div>
                            </div>)
        }
        
        return (
            restaurant
        );
    }
}
function App() {
    return (
        <div className="App">
            <SimpleMap />
        </div>
    );
}
export default hot(module)(App);