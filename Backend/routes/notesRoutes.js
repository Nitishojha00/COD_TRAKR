const express = require("express");
const {
  createProblem,
  getAllProblem,
  getSingleProblem,
  updateProblem,
  deleteProblem,
  getElementByTag,
  getElementBySpecificStar,
  getElementByImportance
} = require("../controllers/noteController");
const auth  = require('../middlewares/auth');
const router = express.Router();


router.post("/new", auth, createProblem);
router.get("/problem", auth, getAllProblem); 
router.get("/problemByImportance", auth, getElementByImportance);   
router.get("/problemById/:problemId", auth, getSingleProblem);  
router.put("/problem/:problemId", auth, updateProblem);
router.delete("/problem/:problemId", auth, deleteProblem); 

/* FILTERS */
router.get("/tag/:tag", auth, getElementByTag);          
router.get("/stars/:stars", auth, getElementBySpecificStar); 

module.exports = router;
