<?php
namespace FortAwesome;

use \Exception, \Error;

defined( 'WPINC' ) || die;
defined( 'FONTAWESOME_PLUGIN_FILE' ) || define( 'FONTAWESOME_PLUGIN_FILE', 'font-awesome/index.php' );

// Loader pattern follows that of wponion.
// Thanks to Varun Sridharan <varunsridharan23@gmail.com>.

if ( ! class_exists( 'FortAwesome\FontAwesome_Loader' ) ) :
	/**
	 * Class FontAwesome_Loader
	 *
	 * @since 4.0
	 */
	final class FontAwesome_Loader {
		/**
		 * Stores Loader Instance.
		 *
		 * @var \FontAwesome_Loader
		 * @static
		 */
		public static $_instance = null;

		/**
		 * Stores metadata about the various modules attempted to be
		 * loaded as the FontAwesome plugin.
		 *
		 * @var array
		 * @static
		 */
		public static $_loaded = array();

		/**
		 * Stores Data.
		 *
		 * @var array
		 * @static
		 */
		public static $data = array();

		/**
		 * FontAwesome_Loader constructor.
		 */
		public function __construct() {
			add_action( 'plugins_loaded', [ &$this, 'load_plugin' ], -1 );
			add_action( 'activate_' . FONTAWESOME_PLUGIN_FILE, [ &$this, 'activate_plugin' ], -1);
		}

		/**
		 * Choose the plugin installation with the latest version to be the one
		 * that we'll load.
		 */
		private function select_latest_version_plugin_installation() {
			if ( count(self::$_loaded) > 0 ) return;

			$versions = array_keys( self::$data );

			usort($versions, function($a, $b) {
				if(version_compare($a, $b, '=')){
				  return 0;
				} elseif(version_compare($a, $b, 'gt')) {
				  return -1;
				} else {
				  return 1;
				}
			});

			$latest_version = $versions[0];
			$info           = ( isset( self::$data[ $latest_version ] ) ) ? self::$data[ $latest_version ] : [];

			if ( empty( $info ) ) {
				$ms = __( 'Unable To Load Font Awesome Plugin. Please Contact The Author', 'fontawesome' );
				wp_die( $ms . '<p style="word-break: break-all;"> <strong>' . __( 'ERROR ID : ', 'wponion' ) . '</strong>' . base64_encode( wp_json_encode( self::$data ) ) . '</p>' );
			}

			if ( ! version_compare( PHP_VERSION, '5.6', '>=' ) ) {
				$msg = sprintf( __( 'Font Awesome plugin incompatible with PHP Version %2$s. Please Install/Upgrade PHP To %1$s or Higher ', 'fontawesome' ), '<strong>5.6</strong>', '<code>' . PHP_VERSION . '</code>' );
				wp_die( $msg );
			}

			self::$_loaded = array(
				'path'    => $info,
				'version' => $latest_version,
			);
		}

		/**
		 * Loads the plugin installation that has been selected for loading.
		 */
		public function load_plugin() {
			$this->select_latest_version_plugin_installation();
			require self::$_loaded['path'] . 'font-awesome-init.php';
		}

		/**
		 * Loads the activation hook for the plugin installation that has been
		 * selected for loading.
		 */
		public function activate_plugin() {
			$this->select_latest_version_plugin_installation();
			try {
				require_once self::$_loaded['path'] . 'includes/class-fontawesome-activator.php';
				FontAwesome_Activator::activate();
			} catch ( Exception $e ) {
				echo '<div class="error"><p>Sorry, Font Awesome could not be activated.</p></div>';
				exit;
			} catch ( Error $e ) {
				echo '<div class="error"><p>Sorry, Font Awesome could not be activated.</p></div>';
				exit;
			}
		}

		/**
		 * Runs initialize() for the plugin installation that has been selected for loading.
		 * convenience static method for initialize_plugin().
		 */
		public static function initialize() {
			self::instance()->initialize_plugin();
		}

		/**
		 * Runs initialize() for the plugin installation that has been selected for loading.
		 */
		public function initialize_plugin() {
			$this->select_latest_version_plugin_installation();
			try {
				require_once self::$_loaded['path'] . 'includes/class-fontawesome-activator.php';
				FontAwesome_Activator::initialize();
			} catch ( Exception $e ) {
				echo '<div class="error"><p>Sorry, Font Awesome could not be initialized.</p></div>';
				exit;
			} catch ( Error $e ) {
				echo '<div class="error"><p>Sorry, Font Awesome could not be initialized.</p></div>';
				exit;
			}
		}

		/**
		 * Uninstalls, cleaning up database tables and such, if this represents
		 * the last plugin installation trying to clean up.
		 * If there would be other remaining installations, it does not uninstall,
		 * since one of those others will end up becoming active and relying on the options data.
		 */
		public static function maybe_uninstall() {
			if( count( self::$data ) == 1 ) {
				// If there's only installation in the list, then it's
				// the one that has invoked this function and is is about to
				// go away, so it's safe to clean up.
				$version_key = array_keys( self::$data )[0];

				require_once trailingslashit( self::$data[$version_key] ) . 'includes/class-fontawesome-deactivator.php';
				FontAwesome_Deactivator::uninstall();
			}
		}

		/**
		 * Deactivates, cleaning up database tables and such, if this represents
		 * the last plugin installation.
		 * If there would be other remaining installations, it does not deactivate,
		 * since one of those others will end up becoming active and relying on the data.
		 */
		public static function maybe_deactivate() {
			if( count( self::$data ) == 1 ) {
				$version_key = array_keys( self::$data )[0];

				require_once trailingslashit( self::$data[$version_key] ) . 'includes/class-fontawesome-deactivator.php';
				FontAwesome_Deactivator::deactivate();
			}
		}

		/**
		 * Creates A Static Instances
		 *
		 * @return \FontAwesome_Loader
		 */
		public static function instance() {
			if ( null === self::$_instance ) {
				self::$_instance = new self();
			}
			return self::$_instance;
		}

		/**
		 * Stores plugin version and its details
		 *
		 * @param string      $data other information.
		 * @param string|bool $version framework version.
		 *
		 * @return $this
		 */
		public function add( $data = '', $version = false ) {
			if ( file_exists( trailingslashit( $data ) . 'index.php' ) ) {
				if ( false === $version ) {
					$args    = get_file_data( trailingslashit( $data ) . 'index.php', array( 'version' => 'Version' ) );
					$version = ( isset( $args['version'] ) && ! empty( $args['version'] ) ) ? $args['version'] : $version;
				}
				self::$data[ $version ] = trailingslashit( $data );
			}
			return $this;
		}
	}
endif; // ! class_exists

if ( ! function_exists( 'FortAwesome\font_awesome_load' ) ) {
	/**
	 * Adds plugin installation path to the list array which later used to compare and
	 * load the plugin from a plugin installation which has the latest version.
	 *
	 * @param string $plugin_installation_path
	 * @param bool   $version
	 */
	function font_awesome_load( $plugin_installation_path = __DIR__, $version = false ) {
		FontAwesome_Loader::instance()
			->add( $plugin_installation_path, $version );
	}
}

if ( function_exists( 'FortAwesome\font_awesome_load' ) ) {
	font_awesome_load( __DIR__ );
}
