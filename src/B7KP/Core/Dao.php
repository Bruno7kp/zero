<?php 
namespace B7KP\Core;

class Dao
{
	private $crud;
	private static $instance;
	
	private function setConn()
	{
		$this->crud = new Crud(App::get("dsn"), App::get("user"), App::get("password"));
		$this->crud->setErrorCallbackFunction("echo");
	}

	static function getConn()
	{
        if (!isset(self::$instance)) 
        { 
			self::$instance = new self;
			self::$instance->setConn();
		}

		return self::$instance;
    }

    public function create($entity, $data)
    {
    	return $this->crud->insert($entity, $data);
    }

    public function create_var($entity, $fields, $data)
    {
    	return $this->crud->multi_insert($entity, $fields, $data);
    }

    public function update($entity, $data, $where, $bind)
    {
    	return $this->crud->update($entity, $data, $where, $bind);
    }

    public function select($table, $cond, $params)
    {
    	return $this->crud->select($table, $cond, $params);
    }

    public function find($entity, $cond, $order = false, $limit = false, $andor = "AND", $like = "=")
	{
		$params = array();
		$where = "";
		if(is_array($cond))
		{
			$and = 0;
			$end = count($cond);
			foreach ($cond as $key => $value) {
				$params[":".$key] = $value;
				$where .= $key." ".$like." :".$key." ";
				if($end > 0 && $and < ($end-1))
				{
					$where .= " ".$andor." ";
				}
				$and++;
			}
		}
		else
		{
			$where = $cond;
		}
		if($order)
		{
			$where .= " ORDER BY ".$order;
		}
		if($limit)
		{
			$where .= " LIMIT ".$limit;
		}
		return $this->crud->select(strtolower($entity), $where, $params);
	}

	public function findBy($entity, $cond, $by = "id", $fields = "*")
	{
		return $this->crud->select(strtolower($entity), $by." = :".$by, array(":".$by => $cond), $fields);
	}

	public function run($sql, $bind = "")
	{
		return $this->crud->run($sql, $bind);
	}

	public function searchDependencies($tables, $cond, $bind = "",$cols = "*", $order = "")
	{
		$sql = "SELECT ".$cols." FROM ".$tables." WHERE ".$cond." ".$order;

		return $this->run($sql, $bind);
	}

	public function delete($table, $where, $bind="") {
		return $this->crud->delete($table, $where, $bind);
	}
}
?>