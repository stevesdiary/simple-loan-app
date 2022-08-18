const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const { randomUUID } = require('crypto');
// const { set } = require('mongoose');
const app = express();
const dayjs = require('dayjs');

require('dotenv').config();

const connection = mysql.createConnection({
   host: process.env.HOST,
   port: process.env.PORT,
   user: process.env.USERNAME,
   password: process.env.PASSWORD,
   database: process.env.DATABASE
})

connection.connect((err)=>{
   if (err)throw err;
   console.log('Connected to MYSQL server')
})

app.use(bodyParser.json());

app.post('/loan', (req, res)=>{
   const body = req.body
   // const fName = req.body.firstName
   // const lName = req.body.lastName
   const principal = req.body.principal


   const interest = 2/100 * principal
   // const principal = req.body.principal
   
   let amountPaid = 0
   const toRepay = ((interest + principal) - amountPaid)
   amountPaid = toRepay - principal
   // for (let i = 1; i < 6; i++){
   //    const element = body[i]
   
   let date = dayjs().format('YYYY-MM-DD HH:mm:ss');
      console.log(date)
   let loanStatus = ''
      if (amountPaid < toRepay){
         loanStatus = 'partial'
      }else{
         loanStatus = 'paid'
      }

      const query = "INSERT INTO `loan` (`id`, `firstName`, `lastName`, `principal`, `interest`,`toRepay`, `createdAt`, `loanStatus` ) VALUES('"+randomUUID()+"', '"+ body.firstName +"', '"+ body.lastName +"', '" + body.principal+ "', '" + interest + "', '" + toRepay + "', '"+ date +"', '"+ loanStatus +"')"
      connection.query(
         query,
         function(error, result){
            console.log(result, error)
            res.send(result != null ? 'Success' : 'Failed to add to entries')
         }
      )
   }
)

app.get('/loans', (req, res)=>{
   // const body = req.params.page
   
   const page1 = req.query.page

   var perPage = req.query.perPage; // 5 is the offset or step of the next limit
   console.log(perPage, page1)
   const query = `SELECT * FROM loan ORDER BY firstName LIMIT ${perPage}  OFFSET ${page1}`

   connection.query(
      query,
      function(error, result){
         console.log(result, error)
         res.send(result != null ? result : error)
      }
   );
})
app.get('/search', (req, res)=>{
   const body = req.query.find
   // const {page, size} = req.params
   const query = "SELECT * FROM `loan` WHERE `firstName` = '"+ body +"' OR `lastName` = '"+ body +"'"
   connection.query(
      query,
      function(error, result){
         console.log(result, error)
         res.send(result != null && result.length>0 ? result : "Cannot find the query")
      }
   );
})
app.get('/searchbystatus', (req, res)=>{
   const body = req.query.status
   const query = "SELECT * FROM `loan` WHERE `loanStatus` = '"+ body +"'"
   connection.query(
      query,
      function(error, result){
         console.log(result)
         res.send(result != null && result.length>0 ? result : error)
      }
   );
})

app.get('/:id', (req, res)=>{
   const id = req.params.id
   const query = "SELECT * FROM `loan` WHERE `id` = '"+id+"'"
      connection.query(
      query,
      function(error, result){
         console.log(result, error)
         res.json(result != null && result.length>0 ? result  : "Entry not found in the Database")
      }
   );
})

app.patch('/update', (req, res)=> {
   const amountPaid = req.body.amountPaid
   const id = req.body.id
   const principal = req.body.principal
   const interest = 2/100 * principal
   const disbursed = parseFloat(interest) + parseFloat(principal);
   let dateUpdated = dayjs().format('YYYY-MM-DD HH:mm:ss');
   const payed = `SELECT principal, toRepay FROM loan WHERE id = '${id}'`
   connection.query(
      payed,
      function (error, result){
         var prevPayment = result
         // console.log(prevPayment, disbursed, parseFloat(prevPayment[0].toRepay))
         let balance = parseFloat(disbursed) - parseFloat(prevPayment[0].toRepay)
         let totalPaid = parseFloat(prevPayment[0].toRepay) + parseFloat(amountPaid)
         let newBalance = parseFloat(balance) - parseFloat(amountPaid)
         console.log(amountPaid, totalPaid, newBalance, balance)
         
            // console.log(disbursed, balance, payed)
         let loanStatus = ''
            if (disbursed > totalPaid){
               loanStatus = 'partial'
            }else{
               loanStatus = 'paid'
            }
               const query =
            `UPDATE loan 
            SET 
               amountPaid = '${totalPaid}', 
               toRepay = '${newBalance}',
               loanStatus = '${loanStatus}',
               updatedAt = '${dateUpdated}'
            WHERE id = '${id}'
            `
            connection.query(
               query,
               function (error, result){
                  console.log(error, "Successfully updated:", result)
                  res.send(result != null ? result : error)
               }
            )
      }
   )  
})

app.delete('/:id', (req, res)=>{
   const body = req.params
   console.log(body)
   const query = "DELETE FROM `loan` WHERE `id` = '"+ body.id +"'"
      connection.query(
      query,
      function(error, result){
         console.log(result, error)
         res.send(result != null ? result : 'Cannot process query')
      }
   );
})

app.use(bodyParser.json());
app.listen(5000, ()=> console.log('App listening on port 5000'));