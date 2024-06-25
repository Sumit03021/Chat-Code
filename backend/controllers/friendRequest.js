const express= require("express");
const router= express.Router();
const Friend= require("../models/Friend");
const User= require("../models/User");
const{setUser,getUser}= require("../middleware/jwt");
const {validateUser , existingFriendOrNot} = require("../middleware/postMiddleware")

//sending a friend request;
router.get("/friendRequest/:id", validateUser,existingFriendOrNot, async(req,res)=>{
  try{
    let {id}= req.params ;
    let userId=req.user.id;
    let user= await User.findById(id);
        if(!user){
         return res.status(400).send({message:"user not found"});
        }
        let friendObj= await Friend.create({sourceId:userId,targetId:id});
        await friendObj.save();
 let notificationObj1={
    friend:friendObj._id,
    category:"sendRequest",
    message:"send you a friend request."
}
await User.updateOne({_id:id,},{$push:{notifications:notificationObj1}});
await user.save();
return res.status(201).send({message:"success"});
}
catch(err){
  return res.status(500).send({message:err.message})
}
})

//accepting a friend request
router.get("/acceptRequest/:index", validateUser, async(req,res)=>{
    try{
   let {index} = req.params || 0;
  let userId = req.user.id;
  let user = await User.findById(userId);
  
  if(user.notifications.length <= index){
    return res.status(400).send({message:"empty notification"});
  }
  let friendId = user.notifications[index].friend.toString();
  let friend= await Friend.findById(friendId);
  let senderId= friend.sourceId.toString();
  let targetId=friend.targetId.toString();
  let sender= await User.findById(senderId);
  sender.friends.push(friend);
  user.friends.push(friend);
  if(index >= 0){
    user.notifications.splice(index,1);
  }
  let notificationObj = {
    friend:null,
    category:"friendRequest",
    message:`your friend request is accepted by ${user.firstName+" "+user.lastName}`
  }
sender.notifications.push(notificationObj);
   await user.save();
  await sender.save();
  return res.status(201).send({message:"success"});
    }
    catch(err){
      return res.status(500).send({message:err.message})
    }
})

//reject request
router.get("/rejectRequest/:index", validateUser ,async(req,res)=>{
    try{
      let userId = req.user.id;
       let {index} = req.params ;
  let user = await User.findById(userId);
  if(user.notifications.length <= index){
    return res.status(400).send({message:"empty notification"});
  }
  let friendId = user.notifications[index].friend.toString();
  let friend = await Friend.findByIdAndDelete(friendId);
  if(index >= 0){
    user.notifications.splice(index,1);
  }
  await user.save();
  return res.status(201).send({message:"success"});
    }
    catch(err){
      return res.status(500).send({message:err.message})
    }
})

//finding all friends of the login user
router.get("/getAllFriends",validateUser,async(req,res)=>{
  try{
     let userId= req.user.id
;    let user=await  User.findById(userId)
    let friendsList= [];
    for(let item of user.friends){
      let friendItem= await Friend.findById(item.toString());
      let sourceId= friendItem.sourceId;
      let targetId= friendItem.targetId;
      if(userId!=sourceId){
        let friend= await User.findById(sourceId)
      let newObj={...friend._doc,friendId:friendItem._id}
        friendsList.push(newObj);

      }
      
        else{
          let {_doc}= await User.findById(targetId)
          let newObj={..._doc,  friendId:friendItem._id.toString()}
            friendsList.push(newObj);
    
      }
    }
    console.log(friendsList);
    return res.status(201).send(friendsList);
  }
  catch(err){
   return res.status(500).send({error:err.message});
  }
});

// check notification routes
router.get("/user/notify", validateUser, async(req,res)=>{
  try {
    let userId = req.user.id;
    console.log("user: ",userId);
    let user = await User.findById(userId);
    // let notification = user.notifications;
    res.status(200).send({message:"success",notification:user});
  } catch (error) {
    res.status(500).send({message:err.message});
  }
})


module.exports=router;
