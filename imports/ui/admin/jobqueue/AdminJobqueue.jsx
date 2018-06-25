import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import React from 'react';

import jobQueue from '/imports/api/jobqueue/jobqueue.js';

import { formatDate } from '/imports/ui/util/uiUtil.jsx';

const Status = (props) => {
  let labelClass = 'badge ';
  switch(props.status){
    case 'completed':
      labelClass += 'badge-success'
      break
    case 'cancelled':
      labelClass += 'badge-warning'
      break
    case 'failed':
      labelClass += 'badge-danger'
      break
    case 'running':
      labelClass += 'badge-primary'
      break
    default:
      labelClass += 'badge-light'
  }
  return (
    <span className={labelClass}> {props.status} </span>
  )
}

export const JobProgressBar = ({ progress, loading, ...job }) => {
  if (loading){
    return null
  }

  const { completed, total, percent } = progress;
  
  const barColor = completed === 1 && total === 1 ? 'success' : 'default';

  console.log(completed, total, barColor)

  return (
    <div className = 'progress'>
      <div 
        className = {`progress-bar bg-${barColor}`}
        role = 'progressbar'
        aria-valuenow = { Math.round(percent) }
        aria-valuemin='0'
        aria-valuemax='100'
        style={{width:`${percent}%`}}
      >
        {`${percent}%`}
      </div>
    </div>
  )
} 

class AdminJobqueue extends React.Component {
  constructor(props){
    super(props)
  }

  reRunJob = (event) => {
    jobId = event.target.name
    jobQueue.getJob(jobId, (err, job) => {
      job.rerun();
    });
  }

  render(){
    const { loading, jobs, ...props } = this.props;
    return (
      loading ? 
      <div> Loading </div> :
      <table className="table table-hover table-sm">
        <thead>
          <tr>
            {
              ['Status','Type','Created','User','Progress','Actions'].map(label => {
                return <th key={label} scope='col'>
                  <button type='button' className='btn btn-sm btn-outline-dark py-0 px-2' disabled>
                    { label }
                  </button>
                </th>
              })
            }
          </tr>
        </thead>
        <tbody>
          {
            jobs.map(job => {
              return (
                <tr key={job._id}>
                  <td><Status {...job} /></td>
                  <td>{job.type}</td>
                  <td>{formatDate(job.created)}</td>
                  <td>{job.data.userId}</td>
                  <td><JobProgressBar loading={loading} {...job} /></td>
                  <td>
                    <button 
                      type='button' 
                      className='btn btn-outline-dark btn-sm py-0 px-2'
                      onClick={this.reRunJob}
                      name={job._id}
                    >Rerun</button>
                  </td>
                </tr>
              )
            })
          }
        </tbody>
      </table>
    )
  }
}

export default withTracker(props => {
  const subscription = Meteor.subscribe('jobQueue')
  return {
    jobs: jobQueue.find({}).fetch(),
    loading: !subscription.ready()
  }
})(AdminJobqueue)