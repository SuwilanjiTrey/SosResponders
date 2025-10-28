how will responders respond to SOS?
For basic users:
	1: when someone sends an SOS they should recieve a notification
		how? in the circles collection, get the uid of everyone saved in that collection and send the SOS to them in their own notification subcollection

		users/autoid/
				|->(subcollection) circles/autoid/
											|->
												addedAt October 23, 2025 at 1:17:16 PM UTC+2
												(timestamp)
												category "Sibling"
												(string)
												invitedBy "7l67lPM2f9Np52F1HoA1NWFE9YT2"
												(string)
												isRegistered true
												(boolean)
												mobileNumber "0979150935"
												(string)
												name "Jordan Sekele"
												(string)
												status "accepted" 
				|->(sucollection) notifications/autoid/
													|->
													category "Emergency"
													(string)
													circleMemberId "5g1uLEAUOed6HW8baywR"
													(string)
													createdAt October 23, 2025 at 3:29:30 PM UTC+2
													(timestamp)
													fromUserId "mzYfMpkRwAPgrN45dSqcy0EESFe2"
													(string)
													fromUserName "taizya yambayamba"
													(string)
													fromUserPhone "0962380867" 
													message "taizya yambayamba invited you to their Emergency circle"
													(string)
													status "accepted"
													(string)
													type "circle_invitation" 
				|->createdAt October 23, 2025 at 12:27:06 PM UTC+2
				(timestamp)
				|->	email "mamichokayombo@gmail.com"
					(string)
				|->	fcmTokens
				(map)
					isPremium false
					(boolean)
					lastActiveAt October 23, 2025 at 12:27:06 PM UTC+2
					(timestamp)
					mobileNumber "+260977287613"
					(string)
					name "Mamicho Kayombo "
					(string)
					phoneVerified true
					(boolean)
					settings
					(map)
					audio false
					(boolean)
					camera false
					(boolean)
					emailFallback true
					(boolean)
					location true
					(boolean)
					photo false
					(boolean)
					smsFallback false
					(boolean)
					updatedAt October 23, 2025 at 12:29:19 PM UTC+2

		
For premium users:
	1:same logic as above but also send to the "Responders" collection:
	
	2: Responders collection:
		this is in the root collection structure and this is my design:
		
		Responders/autoid/
					|->institutionName: String
					|->Branch: String
					|->location: Geoloation
					|->contactInfo: String
					(subcollection)SOS/autoid/
										|->madeBy: String (uderid of the person who made the SOS)
										|->location: geolocation (location of the sos done on the users side)
										|->information: String (if empty then user did not have time to specfy the emergency making it serious)
										|->contact: string (collected from the users uid)
										
										
	3: when a user makes an SOS, if their location is close to the location of any repsonder, let the responder recieve the SOS, if not in vicinity then the responder will not get the notification
	
whats needed:
	1: responders page both on mobile and on web
		web use react, mobile react native

maps: use openstreet map and NOT ANY NATIVE MAPS AT ALL 
