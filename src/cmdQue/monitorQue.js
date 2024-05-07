'use strict'
const log = require('logger')
const redis = require('redisclient')
const QUE_NAME = process.env.SHARD_QUE_NAME || 'guildQue'
const Que = require('./que')
/*
let count = 0
const removeJob = async(job)=>{
  try{
    if(job){
      let timeNow = Date.now()
      let timeStamp = job.timestamp
      if(!timeStamp) timeStamp = job.finishedOn
      if(!timeStamp) timeStamp = 130 * 1000
      const timeDiff = Math.abs(timeNow - timeStamp)
      //console.log(timeDiff)
      const state = await job.getState()
      if(state === 'failed'){
        log.info('Killing failed job '+job.id)
        await job.remove()
      }
      if(state === 'stuck' && +timeDiff > 120 * 1000){
        log.info('Killing stuck job '+job.id)
        await job.remove()
      }
      if(state === 'completed' && timeDiff > 20 * 1000){
        log.info('Removing completed job '+job.id)
        await job.remove()
      }
    }
  }catch(e){
    return
  }
}
const checkJobs = async(cmdQue)=>{
  try{
    if(cmdQue){
      let jobs = await Que.getJobs()
      for(let i in jobs) await removeJob(jobs[i])
    }
  }catch(e){
    log.error('Error with checkJobs...')
    log.error(e);
  }
}
const forceClear = async()=>{
  try{
    let jobs = await redis.keys('bull:'+queName+':*')
    return
    if(jobs?.length > 0){
      for(let i in jobs){
        if(!jobs[i].includes('-') || jobs[i].includes('stalled')) continue
        let job = await redis.hget(jobs[i])
        if(job?.failedReason){
          log.log('Force deleting failed job ...'+jobs[i])
          await redis.del(jobs[i])
        }
      }
    }
  }catch(e){
    log.error('Error with forceClear...')
    log.error(e);
  }
}
const Sync = async() =>{
  try{
    await checkJobs()
    await forceClear()
    let id = await redis.get('bull:'+queName+':id')
    if(id && +id > 1000) redis.del('bull:'+queName+':id')

    setTimeout(Sync, 5000)
  }catch(e){
    log.error(e)
    setTimeout(Sync, 5000)
  }
}
*/
const jobFilter = ['failed', 'completed']
const checkJobs = async()=>{
  try{
    let array = []
    let jobs = await Que.getJobs()
    for(let i in jobs){
      let jobId = await checkJob(jobs[i])
      if(jobId) array.push(jobs[i])
    }
    if(array?.length > 0) await clearJobs(array)
  }catch(e){
    log.error(`Error checking jobs...`)
    log.error(e)
  }
}
const checkJob = async(job)=>{
  try{
    if(!job) return
    let state = await job.getState()
    if(!state) return
    if(jobFilter.filter(x=>x === state).length > 0) return job.id
  }catch(e){
    log.error(e)
  }
}
const clearJobs = async(jobs = [])=>{
  try{
    console.log(`Killing ${jobs?.length} jobs...`)
    for(let i in jobs) await clearJob(jobs[i])
  }catch(e){
    log.error(`Error clearing jobs...`)
    log.error(e)
  }
}
const clearJob = async(job)=>{
  try{
    if(!job) return
    let state = await job.getState()
    log.info(`Killing ${state} job ${job.id}...`)
    await job.remove()
  }catch(e){
    log.error(e)
  }
}
const Sync = async() =>{
  try{
    await checkJobs()
    let id = await redis.get('bull:'+QUE_NAME+':id')
    if(id && +id > 1000) redis.del('bull:'+QUE_NAME+':id')

    setTimeout(Sync, 5000)
  }catch(e){
    log.error(e)
    setTimeout(Sync, 5000)
  }
}
module.exports = Sync
