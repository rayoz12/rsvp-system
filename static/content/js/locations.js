

window.locations = {
    wedding: [
        {
            name: "The Good Shepherd Parish Plumpton",
            location: [-33.747619, 150.834128]
        },
        {
            name: "The Montage",
            location: [-33.870295, 151.152016]
        },
        {
            name: "Oatlands Estate",
            location: [-33.794762, 151.029452]
        }
    ],
    stay: {
        hotels: [{
            name: "Novotel Sydney West HQ",
            location: [-33.769641, 150.834029]
        }, {
            name: "Parramatta",
            location: [-33.814548, 151.005427]
        }, {
            name: "Sydney CBD",
            location: [-33.869065, 151.205293]
        }],
        shortTerm: [{
            
        }]
    }

}

const isMobile = () => !window.matchMedia("(min-width: 768px)").matches;

/*To open navigation menu, set the width to 60% of the background overlay*/
function openNav() {
    document.getElementById("sideBar").style.width = "100%";
    document.getElementById("sideNav").style.width = "100%";
}

/*Close navigation*/
function exitNav() {
    document.getElementById("sideBar").style.width = "0";
    document.getElementById("sideNav").style.width = "0";
}
