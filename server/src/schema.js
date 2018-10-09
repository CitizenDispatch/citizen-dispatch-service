//
// GRAPHQL 
//
const resolvers = require('./resolvers')
// const queryIncludes = require('./queryIncludes');
const graphQLFields = require('graphql-fields');

const {
  GraphQLInputObjectType,
  GraphQLObjectType,
  GraphQLEnumType, 
  GraphQLList,
  GraphQLSchema,
  GraphQLString,
  GraphQLInt,
  GraphQLFloat,
  GraphQLNonNull,
  GraphQLBoolean,
  GraphQLID
} = require('graphql');

// 
// USER LOCATION
//

const userLocationFields = {
  id: { type: GraphQLNonNull(GraphQLID), description: "Username aka Cognito sub"},
  latitude: { type: GraphQLNonNull(GraphQLFloat)},
  longitude: { type: GraphQLNonNull(GraphQLFloat)},
  timestamp: { type: GraphQLNonNull(GraphQLString)},
}

UserLocationType = new GraphQLObjectType({
  name: 'UserLocation',
  fields: () => userLocationFields
})

UserLocationInputType = new GraphQLInputObjectType({
  name: 'UserLocationInput',
  fields: () => userLocationFields
})

//
// USER
//

// id not username because that's what caches automatically in Apollo
userFields = () => ({
  id: { type: GraphQLNonNull(GraphQLID) },
  firstName: { type: GraphQLString },
  lastName: { type: GraphQLString },
  location: { type: UserLocationType },
  locationHistory: { type: GraphQLList(UserLocationType) },
  dispatch: { type: DispatchType },  // Reference
  team: { type: TeamType }  // Reference
})

UserType = new GraphQLObjectType({
  name: 'User',
  fields: userFields
})

userInputFields = {
  id: { type: GraphQLNonNull(GraphQLID) },
  firstName: { type: GraphQLString },
  lastName: { type: GraphQLString },
  dispatchId: { type: GraphQLID },
  teamId: { type: GraphQLID }
}

UserInputType = new GraphQLInputObjectType({
  name: 'UserInput',
  fields: () => userInputFields
})

// 
// REQUEST
// 

RequestType = new GraphQLObjectType({
  name: 'Request',
  fields: () => ({
    id: { type: GraphQLNonNull(GraphQLID) },
    phoneNumber: { type: GraphQLString },
    requesterName: { type: GraphQLString },
    requestType: { type: GraphQLString },
    createdAt: { type: GraphQLString },
    latitude: { type: GraphQLFloat },
    longitude: { type: GraphQLFloat },
    userLocation: { type: GraphQLString },
    userInformation: { type: GraphQLString },
    arrivalEta: { type: GraphQLString },
    completionEta: { type: GraphQLString },
    status: { type: GraphQLString }, 
    team: { type: TeamType }, // Reference
    dispatch: { type: DispatchType }, // Reference
    user: { type: UserType }
  })
})

requestInputFields = {
  id: { type: GraphQLID },
  phoneNumber: { type: GraphQLString },
  requesterName: { type: GraphQLString },
  requestType: { type: GraphQLString },
  createdAt: { type: GraphQLString },
  latitude: { type: GraphQLFloat },
  longitude: { type: GraphQLFloat },
  userLocation: { type: GraphQLString },
  userInformation: { type: GraphQLString },
  arrivalEta: { type: GraphQLString },
  completionEta: { type: GraphQLString },
  status: { type: GraphQLString }, 
  teamId: { type: GraphQLID },
  dispatchId: { type: GraphQLID },
  userId: { type: GraphQLID }
}

RequestInputType = new GraphQLInputObjectType({
  name: 'RequestInput',
  fields: () => requestInputFields
})

//
// DISPATCH
//

const dispatchFields = {
  id: { type: GraphQLID },
  name: { type: GraphQLString },
  phoneNumber: { type: GraphQLString},
  verified: { type: GraphQLBoolean },
  leader: { type: UserType }   
}

DispatchType = new GraphQLObjectType({
  name: 'Dispatch',
  fields: () => dispatchFields
})

const dispatchInputFields = {
  id: { type: GraphQLID },
  name: { type: GraphQLString },
  phoneNumber: { type: GraphQLString},
  verified: { type: GraphQLBoolean },
  leaderId: { type: GraphQLID }   
}

DispatchInputType = new GraphQLInputObjectType({
  name: 'DispatchInput',
  fields: () => dispatchInputFields
})

// 
// TEAM
// 

const teamFields = {
  id: { type: GraphQLID },
  name: { type: GraphQLString },
  leader: { type: UserType },
  status: { type: GraphQLString }, // ready|busy|offline
  transportationMode: { type: GraphQLString }, // boat | wheeled | foot 
  requestTypes: { type: GraphQLList(GraphQLString) }, // medical | security | fire | waterRescue | landRescue
  dispatch: { type: DispatchType }
}

TeamType = new GraphQLObjectType({
  name: 'Team',
  fields: () => teamFields
})

const teamInputFields = {
  id: { type: GraphQLID },
  name: { type: GraphQLString },
  leaderId: { type: GraphQLID },
  status: { type: GraphQLString }, // ready|busy|offline
  transportationMode: { type: GraphQLString }, // boat | wheeled | foot 
  requestTypes: { type: GraphQLList(GraphQLString) }, // medical | security | fire | waterRescue | landRescue
  dispatchId: { type: GraphQLID } // reference
}

TeamInputType = new GraphQLInputObjectType({
  name: 'TeamInput',
  fields: () => teamInputFields
})

//
// MISSION
//

// Deprecating mission in favor of consolidating the information under Request

// const missionFields = {
//   id: { type: GraphQLID },
//   status: { type: GraphQLString },
//   etaNextStatus: { type: GraphQLString },
//   request: { type: RequestType },
//   team: { type: TeamType },
//   dispatch: { type: DispatchType }   
// }

// MissionType = new GraphQLObjectType({
//   name: 'Mission',
//   fields: () => missionFields
// })

// const missionInputFields = {
//   id: { type: GraphQLID },
//   status: { type: GraphQLString },
//   etaNextStatus: { type: GraphQLString },
//   requestId: { type: GraphQLID },
//   teamId: { type: GraphQLID },
//   dispatchId: { type: GraphQLID }   
// }

// MissionInputType = new GraphQLInputObjectType({
//   name: 'MissionInput',
//   fields: () => missionInputFields
// })

//
// SYSTEM INFO
//

systemInformationFields = {
  dispatchCount: { type: GraphQLInt },
  requestCount: { type: GraphQLInt },
  requestEpicenter: { type: UserLocationType }
}

SystemInformationType = new GraphQLObjectType({
  name: 'SystemInformation',
  fields: () => systemInformationFields
})

// 
// QUERY & MUTATION
// 

QueryType = new GraphQLObjectType({
  name: 'Query',
  fields: () => ({
    systemInformation: {
      type: SystemInformationType,
      resolve: (parent, args, context, info) => resolvers.getSystemInformation(graphQLFields(info))
    },
    request: {
      type: RequestType,
      args: { id: { type: GraphQLNonNull(GraphQLID) }},
      resolve: (parent, args, context, info) => resolvers.getRequest(args, graphQLFields(info))
    },
    requests: {
      type: GraphQLList(RequestType),
      resolve: (parent, args, context, info) => resolvers.getRequests(graphQLFields(info))
    },
    user: {
      type: UserType,
      args: { id: { type: GraphQLNonNull(GraphQLID) }},
      resolve: (parent, args, context, info) => resolvers.getUser(args, graphQLFields(info))
    },
    userLocation: {
      type: UserLocationType,
      args: { id: { type: GraphQLNonNull(GraphQLID) }},
      resolve: (parent, args, context, info) => resolvers.getUserLocation(args, graphQLFields(info))
    },
    dispatch: {
      type: DispatchType,
      args: { id: { type: GraphQLNonNull(GraphQLID) }},
      resolve: (parent, args, context, info) => resolvers.getDispatch(args, graphQLFields(info))
    },
    dispatches: {
      type: GraphQLList(DispatchType),
      resolve: (parent, args, context, info) => resolvers.getDispatches(graphQLFields(info))
    },
    // mission: {
    //   type: MissionType,
    //   args: { id: { type: GraphQLNonNull(GraphQLID) }},
    //   resolve: (parent, args, context, info) => resolvers.getMission(args, graphQLFields(info))
    // },
    team: {
      type: TeamType,
      args: { id: { type: GraphQLNonNull(GraphQLID) }},
      resolve: (parent, args, context, info) => resolvers.getTeam(args, graphQLFields(info))
    }, 
    teams: {
      type: GraphQLList(TeamType),
      resolve: (parent, args, context, info) => resolvers.getTeams(graphQLFields(info))
    }
  })
})

MutationType = new GraphQLObjectType({
  name: 'Mutation',
  fields: () => ({
    createRequest: { // Legacy, TODO: remove
      type: RequestType,
      args: {
        request: { type: RequestInputType }
      },
      resolve: (parent, args, context, info) => resolvers.createRequest(args)
      },
    upsertRequest: {
      type: RequestType,
      args: requestInputFields,
      resolve: (parent, args, context, info) => resolvers.upsertRequest(args)
    },
    upsertUser: {
      type: UserType,
      args: userInputFields,
      resolve: (parent, args, context, info) => resolvers.upsertUser(args)
    },
    upsertDispatch: {
      type: DispatchType,
      args: dispatchInputFields,
      resolve: (parent, args, context, info) => resolvers.upsertDispatch(args)
    },
    // upsertMission: {
    //   type: MissionType,
    //   args: missionInputFields,
    //   resolve: (parent, args, context, info) => resolvers.upsertMission(args)
    // },
    upsertTeam: {
      type: TeamType,
      args: teamInputFields,
      resolve: (parent, args, context, info) => resolvers.upsertTeam(args)
    },

    // REQUEST ACTIONS
    // Allows for less error-prone actions and more separation of concerns, plus simpler authorization.
    assignRequest: {
      type: RequestType,
      args: {
        requestId: { type: GraphQLNonNull(GraphQLID) },
        teamId: { type: GraphQLID }, // Can be null: unassign
        dispatchId: { type: GraphQLID }, // Can be null: unassign
      },
      resolve: (parent, args, context, info) => resolvers.assignRequest(args)
    },
    updateRequestStatus: {
      type: RequestType,
      args: {
        requestId: { type: GraphQLNonNull(GraphQLID) },
        status: { type: GraphQLNonNull(GraphQLString) },
      },
      resolve: (parent, args, context, info) => resolvers.updateRequestStatus(args)
    },
    assignUser: {
      type: UserType,
      args: {
        userId: { type: GraphQLNonNull(GraphQLID) },
        teamId: { type: GraphQLID },
        dispatchId: { type: GraphQLID }
      }
    }
  })
});

// QueryType = new GraphQLObjectType({
//   name: 'Query',
//   fields: () => ({
//     tags: {
//       type: GraphQLList(TagType),
//       args: { names: { type: GraphQLList(GraphQLString) }},
//       resolve: (_parent, { names }, context, info) => resolver.getTags({names, withTips: queryIncludes(info, 'tips')}),
//     },
//     tag: {
//       type: TagType,
//       args: { name: { type: GraphQLNonNull(GraphQLString) } },
//       resolve: (parent, { name }, context, info) => resolver.getTag({name, withTips: queryIncludes(info, 'tips')}),
//     },
//     trips: {
//       type: GraphQLList(TripType),
//       resolve: () => resolver.getTrips(),
//     },
//     trip: {
//       type: TripType,
//       args: {
//         id: {
//           description: 'id of the trip',
//           type: GraphQLNonNull(GraphQLID),
//         },
//       },
//       resolve: (parent, args, context, info) => resolver.getTrip(args)
//     }
//   }),
// });

// MutationType = new GraphQLObjectType({
//   name: 'Mutation',
//   fields: () => ({
//     upsertTrip: {
//       type: TripType, // The one that was updated
//       args: {
//         // id: {type: GraphQLID}, // If null, create; if not, update // Now included within the trip
//         id: { type: GraphQLID },
//         name: { type: GraphQLString },
//         start_date: { type: GraphQLString },
//         end_date: { type: GraphQLString },
//         tagSelections: { type: GraphQLList(TagSelectionInputType) },
//         tipSelections: { type: GraphQLList(GraphQLID) }
//       },
//       resolve: (parent, args) => resolver.upsertTrip(args)
//     },
//     deleteTrip: {
//       type: GraphQLBoolean,
//       args: { id: {type: GraphQLNonNull(GraphQLID)} },
//       resolve: (parent, { id }) => resolver.deleteTrip(id)
//     },
//     upsertTag: {
//       type: TagType,
//       args: {
//         // name: { type: GraphQLNonNull(GraphQLString) }, // Can be mandatory since the tag's name is chosen not randomly assigned
//         tag: { type: GraphQLNonNull(TagInputType) } 
//       },
//       resolve: (parent, { tag }) => resolver.upsertTag(tag)
//     },
//     deleteTag: {
//       type: GraphQLBoolean,
//       args: {
//         name: {type: GraphQLNonNull(GraphQLString)} // No phase here - this deletes all phases for the tag
//       },
//       resolve: (parent, { name }) => resolver.deleteTag(name)
//     },
//   })
// })

// Schema
module.exports = new GraphQLSchema({
  query: QueryType,
  mutation: MutationType,
})