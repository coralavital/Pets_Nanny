const { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, updatePassword, 
	deleteUser, sendPasswordResetEmail, reauthenticateWithCredential, EmailAuthProvider } = require("firebase/auth");
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, getDoc, updateDoc, query, where, getDocs, deleteDoc, deleteField , arrayUnion } = require('firebase/firestore');
const { use } = require("chai");
const { async } = require('@firebase/util');


function containsAny(source,target)
{
    var result = source.filter(function(item){ return target.indexOf(item) > -1});   
    return (result.length > 0);  
}

class Firebase {
  constructor() {
    this.config = {
      apiKey: "AIzaSyDRiZLhRsj08msE0VMoKOmnuLoTZPTTS3c",
      authDomain: "pets-nanny.firebaseapp.com",
      databaseURL: "https://pets-nanny-default-rtdb.firebaseio.com",
      projectId: "pets-nanny",
      storageBucket: "pets-nanny.appspot.com",
      messagingSenderId: "304619016592",
      appId: "1:304619016592:web:456c2bcf11dab75437e315",
      measurementId: "G-HLCCC1243J"
    };


    this.app = initializeApp(this.config);

    // // make auth and firestore references
    this.auth = getAuth(this.app);
    this.db = getFirestore(this.app);

  }

  //authenticate function
  authenticate(email, password, callback) {
    signInWithEmailAndPassword(this.auth, email, password).then((cred) => {
      callback();
    }).catch(error => {
		switch (error.code) {
			case 'auth/email-already-in-use':
			  console.log(`Email address ${this.state.email} already in use.`);
			  break;
			case 'auth/invalid-email':
			  console.log(`Email address ${this.state.email} is invalid.`);
			  break;
			case 'auth/operation-not-allowed':
			  console.log(`Error during sign up.`);
			  break;
			default:
			  console.log(error.message);
			  break;
		  }
	})
  }

  //signup function
  async signup(email, password, fullname, phone, type, callback, callbackErr) {
    createUserWithEmailAndPassword(this.auth, email, password).then(async (cred) => {
    	const coll = collection(this.db, 'users');
        const user = doc(this.db, 'users', email)
        const result = await setDoc(user, {
          fullname: fullname,
          phonenumber: phone,
          typeOfUser: type
        });
        callback();
    }).catch(error => {
		switch (error.code) {
			case 'auth/email-already-in-use':
			  console.log(`Email address ${email} already in use.`);
			  break;
			case 'auth/invalid-email':
			  console.log(`Email address ${email} is invalid.`);
			  break;
			case 'auth/operation-not-allowed':
			  console.log(`Error during sign up.`);
			  break;
			default:
			  console.log(error.message);
			  break;
		  }
	})

  }

  //logout function
  async logout(callback) {
  await signOut(this.auth).then((cred) => {
    console.log("Sign-out successful.")
    callback();
    });
  }

  //get currenct user firebase data
  async CurrentUserData(){
    const docRef = doc(this.db, 'users', this.auth._currentUser.email);
    const docSnap = await getDoc(docRef);
    return docSnap.data();
  }

  // updating provider details from personal info after sign up
  async UpdateDocProvider(age, area_city, price_per_hour, type_of_service, type_of_pet, about_me, callback){
    const docRef = doc(this.db, 'users', this.auth._currentUser.email);
    console.log(`updating...  ${this.auth._currentUser.email}`)
    await updateDoc(docRef, {
      age: age,
      area_city: area_city,
      price_per_hour: price_per_hour,
      type_of_service: type_of_service,
      type_of_pet: type_of_pet,
      about_me: about_me,
	  email: this.auth._currentUser.email,
    });
    callback();
  }
   // updating client details from personal info after sign up
   async UpdateDocClient(age, address, about_me, callback){
    const docRef = doc(this.db, 'users', this.auth._currentUser.email);
    console.log(`updating...  ${this.auth._currentUser.email}`)
    await updateDoc(docRef, {
      age: age,
      address: address,
      about_me: about_me,
	  email: this.auth._currentUser.email,
    });
    callback();
   }

   // cheching if user is logged in
  IfLoggedin(){
    if(this.auth._currentUser == null){
      return false
    }
    // maybe user need to be const
    let user = this.auth._currentUser;
    onAuthStateChanged(this.auth, () => {
      if (user) {
        console.log(`user is logged in`)
        return true
      } else {
        console.log(`user is NOT logged in`)
        return false
      }
    });
  }

// for filttring table after search
async filtering(ar,price,typeP,typeS ,start, end) {
	var providersResult =[];
	var i; 

	const coll = query(collection(this.db, 'users'), 
	 where("type_of_pet", "array-contains-any", typeP),
	 );
	const querySnapshot =  await getDocs(coll);
	var result=[];
	querySnapshot.forEach((doc) => {
	  result.push(doc.data())
	
	});
  
	for ( i=0 ; i< result.length; i++){
	  if(result[i].price_per_hour <= price ) {
		  if(containsAny(result[i].area_city ,ar)) {
		    if(containsAny(result[i].type_of_service ,typeS)){
         		if(result[i].freeTime != undefined ){
           			for(var j=0; j<result[i].freeTime.length; j++){
              			if(start >= result[i].freeTime[j].start && end <= result[i].freeTime[j].end){
                  			providersResult.push(result[i]);
              }
          }
        }
	  	}
	  }
	}
	
  }
  
	return providersResult;
}


  // Get all documents in a collection
    async GetAllDataOnce(){

      const querySnapshot = await getDocs(collection(this.db, "users"));
      var users = [];
        querySnapshot.forEach((doc) => {
          // doc.data() is never undefined for query doc snapshots
        // console.log(doc.id, " => ", doc.data());
          users.push(doc.data());
        });
        return users;
    }

  // Get all the documents of the providers only
    async GetProviders(){
      const coll = query(collection(this.db, 'users'),where("typeOfUser", "=="  ,"1"));
      let provider = [];
      const querySnapshot =  await getDocs(coll);
      querySnapshot.forEach((doc) => {
        provider.push(doc.data());
      
      });
      return provider;
    }
    
	//change password of user
	async changePassword(cpassword, npassword){
		const email = this.auth._currentUser.email;
		const usr = this.auth._currentUser;

		await reauthenticateWithCredential(usr, EmailAuthProvider.credential(email, cpassword))
		.then(() => {
			updatePassword(usr, npassword).then(() => {
				console.log("update password to",npassword);
			}).catch((error) => {
				console.log("Error at updatePassword\n", error)
			})
		}).catch((error) => {
			switch (error.code) {
				case 'auth/wrong-password':
				  console.log(`${cpassword} is not the current password of this user !`);
				  break;
				default:
					console.log("Error at reauthenticateWithCredential\n", error)
				break;
			  }
		})

	}

	//delete account
	async deleteAccount(callback) {
		deleteDoc(doc(this.db, "users", this.auth._currentUser.email));
		deleteUser(this.auth._currentUser).then(async() => {
			console.log("deleted user");
		}).catch((error ) => {
			console.log("Eror")
		})
		callback();

	}
	
	//update provider document
	async addFreeTime(date, from, to, callback) {
		const userRef = doc(this.db, "users", this.auth._currentUser.email);
		from = from.concat(":00")
		to = to.concat(":00")
		const sdate = date.concat("T", from)
		const start = +new Date(sdate)
		const edate = date.concat("T", to)
		const end = +new Date(edate)
		const userData = await this.CurrentUserData()

		//get id for ecery reservation
		const uniqueId = () => {
			const dateString = Date.now().toString(36);
			const randomness = Math.random().toString(36).substr(2);
			return dateString + randomness;
		};

		await EnterTime({start, end});


		async function EnterTime({start, end}){
			let freeTimeObj = {start, end, title: "Free Time", id: uniqueId(), color: "green"};
			const freeTime = userData.freeTime !== undefined ? userData.freeTime :[];
			freeTime.push(freeTimeObj);
			await updateDoc(userRef, {
				freeTime
			});

		}
		callback()
	}

	async sendEmail(email, callback) {
		await sendPasswordResetEmail(this.auth, email).then(() => {
			callback();
			console.log("Sent reset password to you email!")

		}).catch((e) => {
			console.log(e)
		})
	}

	
	//saving reservations details
	async addReservation(date, from, to, provider, callback) {
		const clientRef = doc(this.db, "users", this.auth._currentUser.email);
		const providerRef = doc(this.db, "users", provider.email);
		from = from.concat(":00")
		to = to.concat(":00")
		const sdate = date.concat("T", from)
		const start = +new Date(sdate)
		const edate = date.concat("T", to)
		const end = +new Date(edate)
		const userData = await this.CurrentUserData()

		//get id for ecery reservation
		const uniqueId = () => {
			const dateString = Date.now().toString(36);
			const randomness = Math.random().toString(36).substr(2);
			return dateString + randomness;
		};

		await EnterTime({start, end});

		async function EnterTime({start, end}){
			let reservationObj = {start, end, title: "Reservation", id: uniqueId(), color: 'red', providerName: provider.fullname, providerEmail: provider.email, 
									price: provider.price_per_hour, providerPhone: provider.phonenumber, address: userData.address , clientEmail: userData.email};
			const reservations = userData.reservations !== undefined ? userData.reservations :[];
			reservations.push(reservationObj);

			await updateDoc(clientRef, {
				reservations
			});
			await updateDoc(providerRef, {
				reservations
			});

		}
		callback()

	};

	//saving contact message details
	async addContactMsg(name, emailSend, messageText, callback) {
		// how the data will be saved in the obj arr
		let msgObj = {date: new Date(), name: name, messageText: messageText};
		const userRef = doc(this.db, "contact", emailSend);
		try{ 
			// getting doc data 
			const docSnap = await getDoc(userRef);
			const contactMsg = docSnap.data();
			var msg_arr =  contactMsg !== undefined ? contactMsg.contactUs  : [];
		} catch(e) {
			msg_arr = []
		}
		msg_arr.push(msgObj);

		await setDoc(userRef, {
			contactUs: msg_arr
		});

		callback();
	};

	//saving contact message details
	async cancelFreeTime(id, callback) {
		var newFree = [];
		const providerRef = doc(this.db, "users", this.auth._currentUser.email);
		const docSnap = await getDoc(providerRef);
		const document = docSnap.data()
		for(var i=0; i<document.freeTime.length; i++){
			console.log(document.freeTime[i])
			if(document.freeTime[i].id != id) {	
				newFree.push(document.freeTime[i])
				
				console.log(newFree)
			}
		}
		//var newFreeTime = document.freeTime.filter(document.freeTime => obj)
		await updateDoc(providerRef, {
			freeTime: newFree
		});
		console.log("The free time deleted")
		callback();

	};

	//saving contact message details
	async cancelReservation(id, emailProvider, emailClient, callback) {
		var newReservationsp = [];
		var newReservationsc = [];
		console.log(emailProvider)
		const providerRef = doc(this.db, "users", emailProvider);
		const clientRef = doc(this.db, "users", emailClient);
		const pdocSnap = await getDoc(providerRef);
		const providerDOC = pdocSnap.data()
		const cdocSnap = await getDoc(clientRef);
		const clientDOC = cdocSnap.data()
		for(var i=0; i<providerDOC.reservations.length; i++){
			console.log(providerDOC.reservations[i])
			if(providerDOC.reservations[i].id != id) {	
				newReservationsp.push(providerDOC.reservations[i])
				
				console.log(newReservationsp)
			}
		}
		//var newFreeTime = document.freeTime.filter(document.freeTime => obj)
		await updateDoc(providerRef, {
			reservations: newReservationsp
		});
		for(var i=0; i<clientDOC.reservations.length; i++){
			console.log(clientDOC.reservations[i])
			if(clientDOC.reservations[i].id != id) {	
				newReservationsc.push(clientDOC.reservations[i])
				
				console.log(newReservationsc)
			}
		}
		//var newFreeTime = document.freeTime.filter(document.freeTime => obj)
		await updateDoc(clientRef, {
			reservations: newReservationsc
		});
		console.log("The reservation deleted from the client schedule and from the provider schedule")
		callback();

	};
	
		
	
}

module.exports = new Firebase()