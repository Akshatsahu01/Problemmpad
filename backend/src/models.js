import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const { Schema, model } = mongoose;
const userSchema = new Schema({ name:{type:String,required:true,trim:true,maxlength:80}, email:{type:String,required:true,unique:true,lowercase:true,trim:true}, passwordHash:{type:String,required:true,select:false} },{timestamps:true});
userSchema.methods.checkPassword = function (password) { return bcrypt.compare(password,this.passwordHash); };
export const User = model('User',userSchema);

const testSchema = new Schema({ input:{type:String,required:true}, expectedOutput:{type:String,default:''}, visibility:{type:String,enum:['sample','hidden'],default:'sample'}, source:{type:String,enum:['manual','ai'],default:'manual'}, verified:{type:Boolean,default:false}, description:{type:String,default:''} },{_id:true});
const problemSchema = new Schema({ owner:{type:Schema.Types.ObjectId,ref:'User',required:true,index:true}, title:{type:String,required:true,trim:true,maxlength:160}, statement:{type:String,default:''}, inputFormat:String, outputFormat:String, constraints:String, difficulty:{type:String,enum:['Easy','Medium','Hard','Custom'],default:'Medium'}, topics:[String], signature:String, language:{type:String,default:'any'}, sourceUrl:String, visibility:{type:String,enum:['private','public'],default:'private'}, notes:String, tags:[String], tests:[testSchema], aiGenerationStartedAt:{type:Date,default:null}, aiTestsGeneratedAt:{type:Date,default:null}, solvedBy:[{type:Schema.Types.ObjectId,ref:'User'}], revision:{type:Number,default:1}, updatedAt:{type:Date,default:Date.now} },{timestamps:true});
problemSchema.index({owner:1,updatedAt:-1});
export const Problem = model('Problem',problemSchema);

export const Submission = model('Submission',new Schema({ owner:{type:Schema.Types.ObjectId,ref:'User',required:true,index:true}, problem:{type:Schema.Types.ObjectId,ref:'Problem',required:true,index:true}, code:{type:String,required:true}, language:{type:String,required:true}, status:{type:String,enum:['Accepted','Wrong Answer','Runtime Error','Compile Error','Error','Pending'],default:'Pending'}, results:[{passed:Boolean,expected:String,actual:String,stderr:String,time:Number}], revision:Number },{timestamps:true}));
export const Collection = model('Collection',new Schema({ owner:{type:Schema.Types.ObjectId,ref:'User',required:true,index:true}, name:{type:String,required:true,trim:true,maxlength:80}, description:String, problems:[{type:Schema.Types.ObjectId,ref:'Problem'}] },{timestamps:true}));
const draftSchema=new Schema({ owner:{type:Schema.Types.ObjectId,ref:'User',required:true}, problem:{type:Schema.Types.ObjectId,ref:'Problem',required:true}, language:{type:String,required:true}, code:{type:String,default:''} },{timestamps:true});
draftSchema.index({owner:1,problem:1,language:1},{unique:true});
export const Draft = model('Draft',draftSchema);
