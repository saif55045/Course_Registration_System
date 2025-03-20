const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    rollNumber: { type: String, unique: true, sparse: true },  
    username: { type: String, unique: true, sparse: true },    
    password: { 
        type: String, 
        required: function() { return this.role === "admin"; } // ✅ Only required for admins
    },  
    role: { type: String, enum: ["student", "admin"], required: true }
});

const User=mongoose.model("User",UserSchema);
module.exports=User;