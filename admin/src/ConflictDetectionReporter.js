import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { setConflictDetectionScanner, userAttemptToStopScanner } from './store/actions'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheckCircle, faCog, faGrin, faSkull, faThumbsUp, faTimesCircle } from '@fortawesome/free-solid-svg-icons'
import { ADMIN_TAB_TROUBLESHOOT } from './store/reducers'
import ConflictDetectionTimer from './ConflictDetectionTimer'
import size from 'lodash/size'
import has from 'lodash/has'

// NOTE: We don't have Webpack set up to handle the loading of CSS modules in
// a way that is compatible with our use of Shadow DOM. After a failed attempt
// to do so, we'll just use the standard React Style Object technique for assigning
// styles.
// See: https://reactjs.org/docs/dom-elements.html#style

const STATUS = {
  running: 'Running',
  done: 'Done',
  submitting: 'Submitting',
  none: 'None',
  error: 'Error',
  expired: 'Expired',
  ready: 'Ready',
  stopped: 'Stopped',
  stopping: 'Stopping'
}

const STYLES = {
  container: {
    position: 'fixed',
    fontFamily:'"Helvetica Neue",Helvetica,Arial,sans-serif',
    right: '10px',
    bottom: '10px',
    width: '450px',
    height: 'auto',
    maxHeight: '60%',
    border: '1px solid #CDD4DB',
    borderRadius: '3px',
    boxShadow: '1px 1px 5px 0 rgba(132,142,151,.3)',
    background: '#008DED',
    zIndex: '99',
    overflowY: 'scroll',
    fontSize: '14px',
    lineHeight: '1.4em',
    color: '#fff'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '5px 20px', 
    color: '#CAECFF'
  },
  content: {
    width: '100%',
    padding: '0 20px 10px 20px',
    boxSizing: 'border-box'
  },
  adminEyesOnly: {
    margin: '0',
    fontSize: '12px'
  },
  h1: {
    margin: '.3em 0',
    fontSize: '14px'
  },
  h2: {
    margin: '.3em 0',
    fontSize: '18px'
  },
  p: {
    margin: '.5em 0'
  },
  link: {
    color: '#fff'
  },
  tally: {
    display: 'flex', 
    alignItems: 'center',
    margin: '.5em 0', 
    textAlign: 'center'
  },
  count: {
    flexBasis: '1em',
    marginRight: '5px',
    fontWeight: '600', 
    fontSize: '20px'
  },
  timerRow: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#0064B1',
    padding: '10px 20px',
    color: '#fff', 
    fontWeight: '600'
  },
  button: {
    margin: '0 0 0 10px',
    border: '0',
    padding: '5px',
    backgroundColor: 'transparent',
    color: '#fff', 
    opacity: '.7',
    cursor: 'pointer'
  }
}

export default function ConflictDetectionReporter() {
  const dispatch = useDispatch()
  const settingsPageUrl = useSelector(state => state.settingsPageUrl)
  const troubleshootTabUrl = `${settingsPageUrl}&tab=ts`
  const activeAdminTab = useSelector(state => state.activeAdminTab )
  const currentlyOnPluginAdminPage = window.location.href.startsWith(settingsPageUrl)
  const currentlyOnTroubleshootTab = currentlyOnPluginAdminPage && activeAdminTab === ADMIN_TAB_TROUBLESHOOT
  const userAttemptedToStopScanner = useSelector(state => state.userAttemptedToStopScanner)

  const unregisteredClients = useSelector(
    state => state.unregisteredClients
  )

  const unregisteredClientsBeforeDetection = useSelector(
    state => state.unregisteredClientDetectionStatus.unregisteredClientsBeforeDetection
  )

  const recentConflictsDetected = useSelector(
    state => state.unregisteredClientDetectionStatus.recentConflictsDetected
  )

  const expired = useSelector(
    state => !state.showConflictDetectionReporter
  )

  const scannerReady = useSelector(
    state => state.conflictDetectionScannerStatus.hasSubmitted && state.conflictDetectionScannerStatus.success
  )

  const scannerIsStopping = useSelector(
    state => userAttemptedToStopScanner
      && !state.conflictDetectionScannerStatus.hasSubmitted
  )

  const userStoppedScannerSuccessfully = useSelector(
    state => userAttemptedToStopScanner
      && !scannerIsStopping
      && state.conflictDetectionScannerStatus.success
  )

  const runStatus = useSelector(state => {
    const { isSubmitting, hasSubmitted, success } = state.unregisteredClientDetectionStatus
    if (userAttemptedToStopScanner) {
      if ( scannerIsStopping ) {
        return STATUS.stopping
      } else if (userStoppedScannerSuccessfully) {
        return STATUS.stopped
      } else {
        // The user clicked to disable the scanner, and that action failed somehow.
        // Probably a fluke in the communication between the browser and the WordPress server.
        return STATUS.error
      }
    } else if (scannerReady) {
      return STATUS.ready
    } else if ( expired ) {
      return STATUS.expired
    } else if ( success && 0 === size( unregisteredClients ) ) {
      return STATUS.none
    } else if ( success ) {
      return STATUS.done
    } else if( isSubmitting ) {
      return STATUS.submitting
    } else if( !hasSubmitted ){
      return STATUS.running
    } else {
      return STATUS.error
    }
  })

  const errorMessage = useSelector(
    state => state.unregisteredClientDetectionStatus.message
  )

  function stopScanner() {
    dispatch(userAttemptToStopScanner())
    dispatch(setConflictDetectionScanner({ enable: false }))
  }

  const expiredOrStoppedDiv = 
    <div>
        <h2 style={ STYLES.tally }><span>{ size( unregisteredClients ) }</span> <span>&nbsp;Results to Review</span></h2>
        <p style={ STYLES.p }>Manage results or restart the scanner
        {
          currentlyOnTroubleshootTab
          ? ' here on the '
          : ' on the '
        }
        {
          currentlyOnTroubleshootTab
          ? <span> Troubleshoot </span>
          : <span> <a href={ troubleshootTabUrl } style={ STYLES.link }>Troubleshoot</a> </span>
        }
        tab
      </p>
    </div>

  const stoppingOrSubmittingDiv =
    <div>
      <div style={ STYLES.status }>
        <h2 style={ STYLES.h2 }><FontAwesomeIcon icon={ faCog } size="sm" spin /> <span>{ runStatus }</span></h2>
      </div>
    </div>

  return (
    <div style={ STYLES.container }>
      <div style={ STYLES.header }>
        <h1 style={ STYLES.h1 }>Font Awesome Conflict Scanner</h1>
        <p style={ STYLES.adminEyesOnly }>only admins can see this box</p>
      </div>
      <div style={ STYLES.content }>

        {
          {
            None:
              <div>
                <div style={ STYLES.status }>
                  <h2 style={ STYLES.h2 }><FontAwesomeIcon icon={ faGrin } size="sm" /> <span>All clear!</span></h2>
                  <p style={ STYLES.p }>No new conflicts found on this page.</p>
                </div>
              </div>,
            Running:
              <div>
                <div style={ STYLES.status }>
                  <h2 style={ STYLES.h2 }><FontAwesomeIcon icon={ faCog } size="sm" spin /> <span>Scanning...</span></h2>
                </div>
              </div>,
            Ready:
              <div>
                <div>
                  <h2 style={ STYLES.h2 }><FontAwesomeIcon icon={ faThumbsUp } size="sm" /> Proton pack charged!</h2>
                  <p style={ STYLES.p }>Wander through the pages of your web site and this scanner will track progress.</p>
                </div>
              </div>,
            Submitting: stoppingOrSubmittingDiv,
            Stopping: stoppingOrSubmittingDiv,
            Done:
              <div>
                <div style={ STYLES.status }>
                  <h2 style={ STYLES.h2 }><FontAwesomeIcon icon={ faCheckCircle } size="sm" /> <span>Page scan complete</span></h2>
                </div>
                <p style={ STYLES.tally }><span style={ STYLES.count }>{ size( Object.keys( recentConflictsDetected ).filter(k => ! has(unregisteredClientsBeforeDetection, k) ) ) }</span> <span>new conflicts found on this page</span></p>
                <p style={ STYLES.tally }><span style={ STYLES.count }>{ size( unregisteredClients ) }</span> <span>total found</span>
                {
                  currentlyOnTroubleshootTab ?
                  <span>&nbsp;(manage conflicts here on the Troubleshoot tab)</span>
                  : <span>&nbsp;(<a href={ troubleshootTabUrl } style={ STYLES.link }>manage</a>)</span>
                }
                </p>
              </div>,
            Expired: expiredOrStoppedDiv,
            Stopped: expiredOrStoppedDiv,
            Error:
              <div>
                <h2 style={ STYLES.h2 }><FontAwesomeIcon icon={ faSkull } /> <span>Don’t cross the streams! It would be bad.</span></h2>
                <p style={ STYLES.p }>
                  { errorMessage }
                </p>
              </div>
          }[runStatus]
        }
      </div>
      <div style={ STYLES.timerRow }>
        <span>
          <ConflictDetectionTimer addDescription>
            <button style={ STYLES.button } title="Stop timer" onClick={() => stopScanner()}>
              <FontAwesomeIcon icon={ faTimesCircle } size="lg" />
            </button>
          </ConflictDetectionTimer>
        </span>
        {
          {
            Expired: "Timer expired",
            Stopped: "Timer stopped"
          }[runStatus]
        }
      </div>
    </div>
  )
}
