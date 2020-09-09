import React, { useState, Component } from "react";
import ReactDOM from "react-dom";
import { hot } from "react-hot-loader";
import GoogleMapReact from 'google-map-react';
import Googlekey from '../key.js';
import { debounce } from 'lodash'
import "../css/App.css";
var infowindow;
var selfMarker;
var directionsDisplay;
var detailService;
var addressSearchService;

const UserPosition = ({ text }) => <div className="userPosition">{text}</div>;
const RestaurantMarker = ({ key, map, lat, lng, target, mapApi, num} ) => {

    let clickRestaurant = () => {
        let request = {
            placeId: target.place_id,
            fields: ['name',
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
    if (num !== undefined){
        clickRestaurant()
    }else{
        return (
            <div key={key}>
                <img style={{ height: '20px', width: '20px' }} src={target.icon} />
                <div className={"trigger"}>
                    <div className={"markerText"} style={{ width: ' max-content', borderRadius: "3em", border: "3px solid yellow" }} onClick={clickRestaurant}>{target.name}</div>
                </div>
            </div>
        );
    }
    
    
}
const Select = ({text, option, onChange})=>{
    let options =[]
    option.map((item,index) => {
        options.push(<option key={index}>{item}</option>)
    })
    return(
        <div style={{ fontSize:"large"}}>{text}
            <select className="custom-select mr-sm-2" style={{ width: "200px" }} onChange={e=>onChange(e.target.value)}>
                {options}
            </select>
        </div>
    );
}
const RestaurantList = ({ restaurantList, onClick, navigate}) => {
    
    let restaurants = []
    restaurantList.map((item,index) => {
        restaurants.push(<div className="restaurantContainer flexRow" style={{ width: '100%' }} key={item.place_id} >
                            <div className="messageContainer flexColumn" id={index} onClick={e =>onClick(e)}>
                                店家名稱:{item.name} <br></br>
                                地址:{item.vicinity} <br></br>
                                評價:{item.rating} <br></br>
                                距離:{item.travel.distance.text} <br></br>
                                預計抵達時間:{item.travel.duration.text} <br></br>
                            </div>
                            <div className="buttonContainer flexColumn">
                                <input type="button" value="開始導航" id={index} onClick={e => navigate(e)}/>
                            </div>
                        </div>)
    })
    return (
        <div className="flexColumn" style={{ height: "100%", width: "100%", opacity: "0.8", backgroundColor:"#FFD306"}}>
            <div className="scrollbar scrollbar-primary restaurantList" style={{width: "100%"}}>
                {restaurants}
            </div>
        </div>
    );
}
const AddressSerach =  ({address, onChange,onClick})=>{

    const valueChange=(event)=>{
        onChange(event)
    }

    let addressList = []
    address.map((item,index)=>{
        addressList.push(<div key={index} id={item.place_id} onClick={e =>onClick(e)}>
                            {item.description}
                        </div>)
    })
    return (<div className={"flexColumn"} style={{ fontSize:"large",width:"100%", backgroundColor:"white"}} >
                <div className={"flexRow"} style={{ flexBasis: "10px", flexGrow: "0"}}>
                    <div>地址</div>
                    <input type="text" onChange={e => { e.persist(); valueChange(e);}}></input>
                </div>
                <div className={"flexColumn"} style={{ flexBasis: "0px", flexGrow: "1", width:"max-content" }}>
                    {addressList}
                </div>
            </div>
    );
}
class RestaurantMap extends Component {
    constructor(props) {
        super(props)
        this.state = {
            userPosition: {
                lat: 24.9868366,
                lng: 121.5108634
            },
            mapCenter: {
                lat: 24.9868366,
                lng: 121.5108634
            },
            zoom:17,
            mapApiLoaded:false,
            mapInstance:null,
            mapApi: null,
            inputAddress:"",
            travelType: "WALKING",
            sortType: "名字",
            places:[]
        }
        this.handleChange = this.handleChange.bind(this)
        this.handleApiLoaded = this.handleApiLoaded.bind(this)
        this.sort = this.sort.bind(this)
        this.transportation = this.transportation.bind(this)
        this.clickRestaurantList = this.clickRestaurantList.bind(this)
        this.typeingAddress = this.typeingAddress.bind(this)
        this.typeingAddress = _.debounce(this.typeingAddress, 500);
        this.choseAddress = this.choseAddress.bind(this)
        this.navigate = this.navigate.bind(this)
    }
    //map move and loaded
    handleChange() {
        if (this.state.mapApiLoaded) {

            this.setState({
                ["mapCenter"]: {
                    lat: this.state.mapInstance.center.lat(),
                    lng: this.state.mapInstance.center.lng()
                }
            })
            const searchService = new google.maps.places.PlacesService(this.state.mapInstance)
            const distanceService = new google.maps.DistanceMatrixService()
            const searchRequest = {
                location: this.state.mapCenter,
                radius: 1000,
                type: ['restaurant']
            }
            //serch for nearbyRestaurant
            searchService.nearbySearch(searchRequest, (searchResults, status) => {

                if (status === this.state.mapApi.places.PlacesServiceStatus.OK) {

                    let targetLoaction = []
                    searchResults.map(item => {
                        targetLoaction.push({ lat: item.geometry.location.lat(), lng: item.geometry.location.lng() })
                    })

                    let distanceRequest = {
                        origins: [this.state.userPosition],
                        destinations: targetLoaction,
                        travelMode: this.state.travelType,
                        unitSystem: google.maps.UnitSystem.METRIC,
                    }
                    //get detail of nearbyRestaurant
                    distanceService.getDistanceMatrix(distanceRequest, function (distanceResults, status) {

                        if (status === google.maps.DistanceMatrixStatus.OK) {

                            searchResults.map((item, index) => {
                                item.travel = distanceResults.rows[0].elements[index]
                            })
                            this.setState({ ["places"]: searchResults })

                            //re-render restaurantList after sort
                            this.sort(this.state.sortType)


                        }
                    }.bind(this))

                }
            })
        }
    }
    handleApiLoaded(map, maps) {
        this.setState({ ["mapInstance"]: map })
        this.setState({ ["mapApi"]: maps })
        this.setState({ ["mapApiLoaded"]: true })

        //render addressSearch controll
        const addressInput = document.createElement("div");
        addressInput.style.width = 'max-content';
        addressInput.style.margin = '10px';
        addressInput.id = "resultAddress"
        ReactDOM.render(AddressSerach({
            address: [], onChange: this.typeingAddress, onClick: this.choseAddress
        }), addressInput);

        //render restaurantList controll
        const restaurantListContainer = document.createElement("div");
        restaurantListContainer.id = "restaurantList"
        restaurantListContainer.style.height = '30%';
        restaurantListContainer.style.width = '30%';
        restaurantListContainer.style.margin = '10px';
        ReactDOM.render(RestaurantList({
            restaurantList: [], onClick: this.clickRestaurantList, navigate: this.navigate
        }), restaurantListContainer);

        //render sort controll
        const SortOptionContainer = document.createElement("div");
        ReactDOM.render(Select({
            text: "排列方式", option: ["名字", "星數", "距離", "抵達時間"], onChange: this.sort
        }), SortOptionContainer);

        //render transportation controll
        const selectTransportationOptionContainer = document.createElement("div");
        ReactDOM.render(Select({
            text: "交通方式", option: ["走路", "開車", "大眾交通", "腳踏車"], onChange: this.transportation
        }), selectTransportationOptionContainer);

        map.controls[google.maps.ControlPosition.RIGHT_CENTER].push(SortOptionContainer);
        map.controls[google.maps.ControlPosition.RIGHT_CENTER].push(selectTransportationOptionContainer);
        map.controls[google.maps.ControlPosition.RIGHT_CENTER].push(restaurantListContainer);
        map.controls[google.maps.ControlPosition.TOP_LEFT].push(addressInput);

        selfMarker = new (this.state.mapApi).Marker({
            position: this.state.userPosition,
            map: this.state.mapInstance,
            title: 'Hello World!'
        })
        //init service
        infowindow = new google.maps.InfoWindow()
        directionsDisplay = new google.maps.DirectionsRenderer({ 'draggable': false });
        detailService = new (this.state.mapApi).places.PlacesService(map)
        addressSearchService = new (this.state.mapApi).places.AutocompleteService()
    }


    //search address
    typeingAddress(event){
        var address = event.target.value
        this.setState({ ["inputAddress"]: address })
        if(address!==""){
            let request = {
                input: this.state.inputAddress
            }
            addressSearchService.getPlacePredictions(request, (searchResults, status) => {
                if (status === this.state.mapApi.places.PlacesServiceStatus.OK) {
                    ReactDOM.render(AddressSerach({
                        address: searchResults, onChange: this.typeingAddress, onClick: this.choseAddress
                    }), document.getElementById("resultAddress"));
                }
            });
        }else{
            ReactDOM.render(AddressSerach({
                address: [], onChange: this.typeingAddress, onClick: this.choseAddress
            }), document.getElementById("resultAddress"));
        }
    }
    choseAddress(event) {
        let request = {
            placeId: event.target.id,
            fields: ['geometry']
        }
        detailService.getDetails(request, (results, status) => {
            if (status === (this.state.mapApi).places.PlacesServiceStatus.OK) {
                this.setState({
                    ["userPosition"]: {
                        lat: results.geometry.location.lat(),
                        lng: results.geometry.location.lng()
                    }
                })

                selfMarker.setMap(null)
                selfMarker = new (this.state.mapApi).Marker({
                    position: this.state.userPosition,
                    map: this.state.mapInstance,
                    title: 'Hello World!'
                })

                ReactDOM.render(AddressSerach({
                    address: [], onChange: this.typeingAddress, onClick: this.choseAddress, setValue: ""
                }), document.getElementById("resultAddress"));

            }
        })


    }

    //Sort and transportation 
    sort(type){
        this.setState({ ["sortType"]: type})
        switch(type){
            case "星數":
                this.setState({ ["places"]: this.state.places.sort(function (a, b) { return b.rating - a.rating }) })
                break;
            case "名字":
                this.setState({ ["places"]: this.state.places.sort(function (a, b) { return (a.name).localeCompare(b.name); }) })
                break;  
            case "距離":
                this.setState({ ["places"]: this.state.places.sort(function (a, b) { return a.travel.distance.value - b.travel.distance.value }) })
                break;
            case "抵達時間":
                this.setState({ ["places"]: this.state.places.sort(function (a, b) { return a.travel.duration.value - b.travel.duration.value }) })
                break;  
        }
        ReactDOM.render(RestaurantList({
            restaurantList: this.state.places, onClick: this.clickRestaurantList, navigate: this.navigate
        }), document.getElementById("restaurantList"));

    }
    transportation(type) {
        switch (type) {
            case "走路":
                this.setState({ ["travelType"]: "WALKING" })
                break;
            case "開車":
                this.setState({ ["travelType"]: "DRIVING" })
                break;
            case "大眾交通":
                this.setState({ ["travelType"]: "TRANSIT" })
                break;
            case "腳踏車":
                this.setState({ ["travelType"]: "BICYCLING" })
                break;
        }
        this.handleChange()
    }

    //RestaurantList function
    clickRestaurantList(event){
        RestaurantMarker({ 
            key: event.target.id, 
            lat: this.state.places[event.target.id].geometry.location.lat(),
            lng: this.state.places[event.target.id].geometry.location.lng(),
            target: this.state.places[event.target.id],
            map: this.state.mapInstance,
            mapApi: this.state.mapApi,
            num: event.target.id})
    }
    navigate(event){

        let request = {
            placeId: this.state.places[event.target.id].place_id,
            fields: ['geometry']
        }
        detailService.getDetails(request, (results, status) => {
            if (status === (this.state.mapApi).places.PlacesServiceStatus.OK) {

                var directionsService = new google.maps.DirectionsService();
                var request = {
                    origin: this.state.userPosition,
                    destination: { 
                        lat: results.geometry.location.lat(),
                        lng: results.geometry.location.lng()},
                    travelMode: this.state.travelType
                };
                directionsService.route(request, function (response, status) {
                    if (status == google.maps.DirectionsStatus.OK) {
                        directionsDisplay.setMap(this.state.mapInstance);
                        directionsDisplay.setDirections(response);
                    }
                }.bind(this));
            }
        })
    }


    render() {
        return (
            <div style={{height:'95vh', width:'100%'}}>
                <GoogleMapReact
                    bootstrapURLKeys={{
                        key: Googlekey,
                        libraries: ['places']}}
                    center={this.state.userPosition}
                    zoom={this.state.zoom}
                    yesIWantToUseGoogleMapApiInternals 
                    onChange={this.handleChange}
                    onGoogleApiLoaded={({ map, maps }) => this.handleApiLoaded(map, maps)}>

                    <UserPosition
                        lat={this.state.userPosition.lat}
                        lng={this.state.userPosition.lng}
                        text="My Place"/>

                    {this.state.places.map((item, index) => (
                        <RestaurantMarker
                            key={index}
                            lat={item.geometry.location.lat()}
                            lng={item.geometry.location.lng()}
                            target={item}
                            map={this.state.mapInstance}
                            mapApi={this.state.mapApi}
                        />
                    ))}

                </GoogleMapReact>
            </div>
        );
    }
}
function App() {
    return (
        <div className="App">
            <RestaurantMap />
        </div>
    );
}
export default hot(module)(App);