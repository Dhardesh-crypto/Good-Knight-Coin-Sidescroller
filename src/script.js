// Application id from moralis.io
Moralis.initialize('iXrIAo95USwRZUbHFzS3CIvD2iGezWbYrZWVjZFC');
//Server url from moralis.io
Moralis.serverURL = 'https://6vsvjpvchvem.bigmoralis.com:2053/server';

function addDOMElement(parent, referenceNode, type, id, value, style, onClickFunction) {
    //Create an input type dynamically.   
    var element = document.createElement("input");
    //Assign different attributes to the element. 
    element.type = type;
    element.value = value;
    element.id = id;
    element.style = style;
    element.onclick = onClickFunction;
  
    var parentElement = document.getElementById(parent);
    parentElement.insertBefore(element, referenceNode);
  }

// Set up code for the additional DOM elements that will be added to the container div
(function () {
    addDOMElement('btnDiv', null, 'button', 'login_button', 'Sign in with MetaMask', 'display: none;', login);
    addDOMElement('btnDiv', null, 'button', 'post-score', 'Post score', 'display: none;', postScore);
    addDOMElement('btnDiv', null, 'button', 'fetch-nfts', 'Fetch NFTs', 'display: none;', getNFTs);
    addDOMElement('btnDiv', document.getElementById('fiatIFrame'), 'button', 'buy-crypto', 'Buy Crypto', 'display: none;', iframeFiat);

    addDOMElement('btnDiv', null, 'hidden', 'score-info', '', undefined);
    addDOMElement('btnDiv', null, 'hidden', 'nft-info', '', undefined);
    addDOMElement('btnDiv', null, 'hidden', 'walletAddress', '', undefined);

 
})();

let moralisUser = login;

(async function(){
    Moralis.initPlugins();
})();

async function login() {
    try {
        let user = await Moralis.Web3.authenticate();
        console.log(user);
        alert("User logged in")
        return user
    } catch (error) {
        console.log(error);
    }
}

async function postScore() {
    try {
        if (document.getElementById('walletAddress').value == '') {
            let user = await Moralis.Web3.authenticate();
            const GoodKnightScore = Moralis.Object.extend("GoodKnightScore");
            const goodKnightScore = new GoodKnightScore();
            goodKnightScore.set("sender", user.get('ethAddress'));
            goodKnightScore.set("score", 1500);
            console.log(user.get('ethAddress') + " scored " + 1500);
            let result = await goodKnightScore.save();
            console.log(goodKnightScore); 
        }
        else {
            let validAddress = Web3.utils.isAddress(document.getElementById('walletAddress').value);
            if (validAddress) {
                const GoodKnightScore = Moralis.Object.extend("GoodKnightScore");
                const goodKnightScore = new GoodKnightScore();
                goodKnightScore.set("sender",document.getElementById('walletAddress').value);
                goodKnightScore.set("score", 1500);
                console.log(document.getElementById('walletAddress').value + " scored " + 1500);
                let result = await goodKnightScore.save();
                console.log(goodKnightScore); 
                alert('Token claim submitted to collective airdrop dataset.\nThank you for submitting...');
            }
            else {
                alert('Your token claim was denied because the given address\nis not a valid ERC-20 Wallet address...');
            }
        }
        
    }
    catch (error) {
        console.log(error);
    }
}

async function getNFTs() {
    try {
        let user = await Moralis.Web3.authenticate();
        const userEthNFTs = await Moralis.Web3API.account.getNFTs();
        document.getElementById('nft-info').value = JSON.stringify(userEthNFTs);

        const options = { addresses: "0x3df128ee3860d4ba9112b7edefa790c9492ecd2e" };
        const tokenMetadata = await Moralis.Web3API.token.getTokenMetadata(options);
        console,log(tokenMetadata);
    }
    catch (error) {
        console.log(error);
    }
}

function buyCrypto() {
    Moralis.Plugins.fiat.buy();
}

async function iframeFiat() {
    if (document.getElementById('fiatIFrame').style.display == 'block') {
        document.getElementById('fiatIFrame').style.display = 'none';
    } 
    else {
        let response = await Moralis.Plugins.fiat.buy({}, {disableTriggers: true});
        document.getElementById('fiatIFrame').style.display = 'block';
        document.getElementById('fiatIFrame').src = response.result.data;
    }
}

document.getElementById("login_button").onclick = login;
document.getElementById("post-score").onclick = postScore;
document.getElementById("fetch-nfts").onclick = getNFTs;
document.getElementById('buy-crypto').onclick = iframeFiat;

function initPayPalButton() { 
    paypal.Buttons({
        style: {
        shape: 'pill',
        color: 'gold',
        layout: 'horizontal',
        label: 'buynow'
        
        },

        createOrder: function(data, actions) {
        return actions.order.create({
            purchase_units: [{"description":"GoodKnightCoin perk pack","amount":{"currency_code":"EUR","value":4.84,"breakdown":{"item_total":{"currency_code":"EUR","value":4},"shipping":{"currency_code":"EUR","value":0},"tax_total":{"currency_code":"EUR","value":0.84}}}}]
        });
        },

        onApprove: function(data, actions) {

            return actions.order.capture().then(function(orderData) {
            
            console.log('Capture result', orderData, JSON.stringify(orderData, null, 2));
            if (orderData?.status == "COMPLETED") {
                
                // Using cookies to rememberlast settings
                var localAmountPerks = (localStorage.getItem('GoodKnightCoinV1A') == null) ? '{}' : localStorage.getItem('GoodKnightCoinV1A');
                var amountsJSON = JSON.parse(localAmountPerks);
                var amountKnightFlight = (amountsJSON?.Jump) ? amountsJSON.Jump : 0;
                var amountKnightProtect =  (amountsJSON?.Protect) ? amountsJSON.Protect : 0;
                var amountKnightSpeed =  (amountsJSON?.Speed) ? amountsJSON.Speed : 0;
                var amountKnightHealingPotions =  (amountsJSON?.Potions) ? amountsJSON.Potions : 0;
                var amountKnightSword =  (amountsJSON?.Sword) ? amountsJSON.Sword : 0;
                localStorage.setItem('GoodKnightCoinV1A', `{ "Jump": ${amountKnightFlight+5}, "Protect": ${amountKnightProtect+5}, "Speed": ${amountKnightSpeed+5}, "Potions": ${amountKnightHealingPotions+5}, "Sword": ${amountKnightSword}}`);
                alert('Thank you for your purchase.\nAfter refreshing you will see your perks.\nRedirecting you to the beginning of the game.');
                window.location.reload();
            }

            // Or go to another URL:  actions.redirect('thank_you.html');
            
        });
        },

        onError: function(err) {
        console.log(err);
        }
    }).render('#paypal-button-container');
}

initPayPalButton();
