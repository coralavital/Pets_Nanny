const home = require('./controllers/home');
const firebase = require('./firebase');
const filter = require('./controllers/filter');
const { type } = require('express/lib/response');
const errorMsg = require('./controllers/errorMsg');
const editFlag = require('./controllers/editor');
const times = require('./controllers/time');
const areaCity = require('./controllers/areaCities');
const sFilters = require('./controllers/sFilter');
const { async } = require('@firebase/util');
const { providers } = require('./controllers/filter');
const { auth } = require('./firebase');
const time = require('./controllers/time');



module.exports = function (app) {
	var providers;
	var providerRef;
	var types;
	var dateFlag = false;
  // index page
  app.get('/', async function (req, res) {
    editFlag.editFalse();
    res.render('pages/index', {
      ourStars: home.ourStars,
      firebase: firebase,
	  userData: null
    });
  });

  // contact page
  app.get('/contact', async function (req, res) {
    editFlag.editFalse();
	if(firebase.IfLoggedin() == false) {
		res.render('pages/contact', {
			firebase: firebase,
			email: "",
			name: "",
			userData: null
		});
	}
	else {
		var userData = await firebase.CurrentUserData()
		res.render('pages/contact', {
			firebase: firebase,
			userData,
			email: firebase.auth._currentUser.email,
			name: userData.fullname,
		});
	}
  });

  // portal page
  app.get('/portal', async function (req, res) {
    editFlag.editFalse();
    var userData = await firebase.CurrentUserData()
    const time = times.time
    const areaCities = areaCity.area_city
    if (filter.flag) {
      providers = await firebase.GetProviders();
    } else {
      providers = await filter.result;
      filter.flag = true
    }
	
	const {date, from, to, typeP, typeS, price, area_city} = req.query;
    res.render('pages/portal', {
	  dateFlag,
	  date,
	  from,
	  to,
	  typeP,
	  typeS,
	  price, 
	  area_city,
	  firebase,
	  providerRef,
	  time: sFilters,
      providers: providers,
      userData: userData,	  
      times: time,
      areaCities
    });
	dateFlag = false;
});
  

  // login-signup page
  app.get('/login', async function (req, res) {
	let userList = await firebase.GetUsersEmails();
    res.render('pages/login', {
		userList
	});
  });

  // enter-personal-info page - client
  app.get('/enter_personal_c', async function (req, res) {
    const userData = await firebase.CurrentUserData()
    res.render('pages/enter_personal_c', {
      fullname: userData.fullname,
      email: firebase.auth._currentUser.email,
      phonenumber: userData.phonenumber,
      errorMsg: errorMsg
    });
  });

  // enter-personal-info page - provider
  app.get('/enter_personal_p', async function (req, res) {
	const areasCities = areaCity.area_city
    const userData = await firebase.CurrentUserData()
    res.render('pages/enter_personal_p', {
	  areasCities,
      fullname: userData.fullname,
      email: firebase.auth._currentUser.email,
      phonenumber: userData.phonenumber,
      errorMsg: errorMsg
    });
  });

  /**
   * Forms submit endpoitns
   */
  app.post('/authenticate', async function (req, res) {
	  const { email, password } = req.body;
	  let userList = await firebase.GetUsersEmails();
	  if(userList.includes(email)) {
			firebase.authenticate(email, password, async () => {
				const userData = await firebase.CurrentUserData()
				if(userData.typeOfUser == 1) {
					if(userData.area_city != null && userData.age != null &&
						userData.type_of_pet != null && userData.type_of_service != null) {
							res.redirect('/portal');
						}
					else {
						res.redirect('/enter_personal_p');
					}
				}
				else {
					if(userData.address != null && userData.age != null) {
							res.redirect('/portal');
						}
					else {
						res.redirect('/enter_personal_c');
					}
				}
			})
		}
  });

  app.post('/signup', function (req, res) {
    const { email, password, fullname, phone, type } = req.body;
    firebase.signup(email, password, fullname, phone, type, () => {
      if (type == 1) {
        res.redirect('/enter_personal_p');
      } else {
        res.redirect('/enter_personal_c');
      }
    })
  });

  app.post('/logout', function (req, res) {
    firebase.logout(() => {
      res.redirect('/');
    })
  });


  // 1.here I will update what the user has entered in personal info page after sign-up 

  //1.1 provider page
  app.post('/personalInfo_provider', function (req, res) {
    var { age, area_city, price, typeP, typeS, about_me } = req.body;
    // if the user didnt fill the minimum reqiure fields
    if (typeS == null || typeP == null || area_city == null) {
      errorMsg.flag = true
      res.redirect('/enter_personal_p')
    }
    // adding the user input to the DB
    else {

      // converting variables data type to array with string
      let type_of_pet = filter.toArray(typeP)
      let type_of_service = filter.toArray(typeS)
      area_city = filter.toArray(area_city)
      firebase.UpdateDocProvider(parseInt(age), area_city, parseInt(price), type_of_pet, type_of_service, about_me, () => {
        res.redirect('/portal');
      })
    }
  });

  //1.2 client page
  app.post('/personalInfo_client', function (req, res) {
    const { age, address, about_me } = req.body;

    // if the user didnt fill the minimum reqiure fields
    if (address == '') {
      errorMsg.flag = true
      res.redirect('/enter_personal_c')
    }
    // adding the user input to the DB
    else {
      firebase.UpdateDocClient(parseInt(age), address, about_me, () => {
        res.redirect('/portal');
      })
    }

  })

  app.post('/filtering', function (req, res) {
	var { area_city, price, typeP, typeS, date, from, to } = req.body;
	sFilters.date = date;
	sFilters.from = from;
	sFilters.to = to;
	var filters = filter.fixParams(area_city, typeP, typeS)
	let ar = filters[0];
	let type_of_pet = filters[1];
	let type_of_service = filters[2];
	types = filters[2];
	dateFlag = true;
	filter.changeProvider(ar, parseInt(price), type_of_pet, type_of_service, sFilters.date, sFilters.from, sFilters.to, () => {
		res.redirect(`/portal?date=${sFilters.date}&from=${sFilters.from}&to=${sFilters.to}&typeP=${typeP}&typeS=${typeS}&price=${price}&area_city=${area_city}`)
	});
});

  // edit-personal-info-provider page - provider
  app.get('/myPersonalInfo', async function (req, res) {
    const areasCities = areaCity.area_city
    const userData = await firebase.CurrentUserData()
    if (userData.typeOfUser == 1) {
      res.render('pages/myPersonalInfo_p', {
		firebase,
		userData,
        fullname: userData.fullname,
        email: firebase.auth._currentUser.email,
        phonenumber: userData.phonenumber,
        age: userData.age,
        price: userData.price_per_hour,
        area_city: userData.area_city,
        type_of_pet: userData.type_of_pet,
        type_of_service: userData.type_of_service,
        about_me: userData.about_me,
        errorMsg: errorMsg,
        editFlag: editFlag,
        areasCities
      });
    }
    else {
      res.render('pages/myPersonalInfo_c', {
		firebase,
		userData,
        fullname: userData.fullname,
        email: firebase.auth._currentUser.email,
        phonenumber: userData.phonenumber,
        age: userData.age,
        address: userData.address,
        about_me: userData.about_me,
        errorMsg: errorMsg,
        editFlag: editFlag,
        areasCities

      });
    }
  });

	//change for client and for provider
	// schedule page - provider
	app.get('/mySchedule', async function (req, res) {
		editFlag.editFalse();
		const userData = await firebase.CurrentUserData()
		const time = times.time;
		const freeTime = userData.freeTime || [];
		const reservations = userData.reservations || [];
		if (userData.typeOfUser == 1) {
			res.render('pages/myScheduleP', {
			firebase,
			userData,
			fullname: userData.fullname,
			email: firebase.auth._currentUser.email,
			phonenumber: userData.phonenumber,
			errorMsg: errorMsg,
			times: time,
			freeTime,
			reservations
			});
		}
		else {
			res.render('pages/myScheduleC', {
			firebase,
			userData,
			fullname: userData.fullname,
			email: firebase.auth._currentUser.email,
			phonenumber: userData.phonenumber,
			errorMsg: errorMsg,
			times: time,
			userData,
			reservations
			});
		}
	});

  //same page for client and provider
  // setting page - provider
  app.get('/mySetting', async function (req, res) {
    editFlag.editFalse();
    const userData = await firebase.CurrentUserData();
    res.render('pages/mySetting', {
		firebase,
		userData,
		fullname: userData.fullname,
		email: firebase.auth._currentUser.email,
		phonenumber: userData.phonenumber,
		errorMsg: errorMsg
    });
  });

  app.post('/myProfile', async function (req, res) {
    const userData = await firebase.CurrentUserData();
    const type = userData.typeOfUser;
    res.redirect('/myPersonalInfo');

  });

  app.post('/home', async function (req, res) {
    const userData = await firebase.CurrentUserData();
    if (userData != null) {
		dateFlag = false;
      	res.redirect('/portal');
    } else {
      res.redirect('/');
    }

  });


  app.post('/mySchedule', async function (req, res) {
    res.redirect("/mySchedule")
  });

  app.post('/mySetting', async function (req, res) {
    res.redirect("/mySetting")

  });


  app.post('/changePassword', async function (req, res) {
    const { cpassword, npassword } = req.body;
    firebase.changePassword(cpassword, npassword, (flag) => {
		if(flag == true) {
			errorMsg.changeMessage = true;
			errorMsg.errorChange = false;
		}
		else if (flag == false) {
			errorMsg.errorChange = true;
			errorMsg.changeMessage = false;
		}
		res.redirect('/mySetting');
	})
  });


  app.post('/deleteAccount', async function (req, res) {
    firebase.deleteAccount (() => {
		res.redirect("/")
		
	  });
    

  });
  //update provider document
  app.post('/updateP', async function (req, res) {
    var { age, price, area_city, typeP, typeS, about_me } = req.body;
    const userData = await firebase.CurrentUserData()
    age = (age == '') ? userData.age : age;
    price = (price == null) ? userData.price : price;
    if (area_city == null) {
      area_city = userData.area_city;
    }
    if (typeP == null) {
      typeP = userData.type_of_pet
    }
    if (typeS == null) {
      typeS = userData.type_of_service
    }

    about_me = (about_me == '') ? userData.about_me : about_me;

    let type_of_pet = filter.toArray(typeP)
    let type_of_service = filter.toArray(typeS)
    area_city = filter.toArray(area_city)
    editFlag.editFalse()

    firebase.UpdateDocProvider(parseInt(age), area_city, parseInt(price), type_of_pet, type_of_service, about_me, () => {
      res.redirect("/myPersonalInfo")
    })

  });
  //update client document
  app.post('/updateC', async function (req, res) {
    var { age, address, about_me } = req.body;
    const userData = await firebase.CurrentUserData()
    age = (age == '') ? userData.age : age;
    address = (address == '') ? userData.address : address;
    about_me = (about_me == '') ? userData.about_me : about_me;

    editFlag.editFalse()
    firebase.UpdateDocClient(parseInt(age), address, about_me, () => {
      res.redirect("/myPersonalInfo")
    })

  });
  //cancel button
  app.post('/cancel', async function (req, res) {
    const userData = await firebase.CurrentUserData();
    editFlag.editFalse()
    res.redirect("/myPersonalInfo")

  });

  //edit button
  app.post('/edit', async function (req, res) {
    const userData = await firebase.CurrentUserData();
    editFlag.editTrue()
    res.redirect("/myPersonalInfo")

  });
  //add free time 
  app.post('/addFreeTime', async function (req, res) {
    const { date, from, to } = req.body
    firebase.addFreeTime(date, from, to, () => {
      res.redirect('/mySchedule');
    })

  });

  //forgot password 
  app.post('/forgotPassword', async function (req, res) {
    const { email } = req.body
    firebase.sendEmail(email, () => {
      res.redirect('/login');
    })

  });

	//add reservation to the documents
	app.post('/addReservation', function (req, res) {
		firebase.addReservation(sFilters.date, sFilters.from, sFilters.to, providerRef, types, () => {
			dateFlag = false;
			res.redirect('/portal')
		})

	});


  //add contact message to a documents
  app.post('/contact', async function (req, res) {
    const { name, email, message } = req.body
	firebase.addContactMsg(name, email, message, () => {
	  res.redirect('/contact');
      
    });
  });

//cancel a free time function only for provider
app.post('/cancelFreeTime', async function (req, res) {
	const { fID } = req.body
	firebase.cancelFreeTime(fID, () => {
		res.redirect('/mySchedule');
		
	});
});

//cancel a reservation
app.post('/cancelReservation', async function (req, res) {
	const { rID, emailProvider, emailClient } = req.body
	firebase.cancelReservation(rID, emailProvider, emailClient, () => {
		res.redirect('/mySchedule');
		
	});
});

//get the provider after clicking on some provider in the search table.
  app.post('/selectProvider', async function(req, res) {
	const { invite } = req.body;
	providerRef = providers[invite];
  })


}