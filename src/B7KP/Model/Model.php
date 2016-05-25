<?php 
namespace B7KP\Model;

class Model
{
	protected $dao;
	
	function __construct(Dao $dao)
	{
		$this->dao = $dao;
	}

	public function add($entity, $arg)
	{
		if(!class_exists($entity))
		{
			throw new MainException("Class ".$entity." not found");
		}

		$this->object = new $entity();
		$this->object->fillData($arg);

		$id = $this->dao->create(strtolower($entity), $this->object->getAllAsArray());

		return $id;
	}

	public function update($entity, $arg)
	{
		if(!class_exists($entity))
		{
			throw new MainException("Class ".$entity." not found");
		}

		$this->object = $this->findOneBy($entity, $arg->id);

		if(count($this->object) != 1)
		{
			throw new MainException($entity." not found");
		}

		$this->object->fillData($arg);

		$rows = $this->dao->update(strtolower($entity), $this->object->getAllAsArray(), "id = :id", array("id" => $this->object->id));

		return $rows;
	}

	public function remove($entity, $id)
	{
		if(!class_exists($entity))
		{
			throw new MainException("Class ".$entity." not found");
		}

		$this->object = $this->findOneBy($entity, $id);
		if(count($this->object) != 1)
		{
			throw new MainException("Object not found");
		}

		return $this->dao->delete($entity, "id = :id", array("id" => $id));
	}

	public function findOneBy($entity, $cond, $by = "id")
	{
		$results = $this->dao->findBy($entity, $cond, $by);
		if(count($results) < 1)
		{
			return false;
			
		}
		return $this->createUniqueObject($entity, $results[0]);
	}

	public function find($entity, $cond, $order = false, $limit = false, $andor = "AND", $like = "=")
	{
		$results = $this->dao->find($entity, $cond, $order, $limit, $andor, $like);
		return $this->createMultipleObjects($entity, $results);
	}

	public function findMtoM($primary, $secondary, $cond = false, $bind = false, $obj = true, $inverse = false, $order = "")
	{
		$contable = $primary."_".$secondary;
		$tables = $primary.", ".$secondary.", ".$contable;
		$bindF = array();
		$cols = "*";

		if(!$cond)
		{
			$cond = $primary.".id = ".$contable.".id".$primary. " AND ".$secondary.".id = ".$contable.".id".$secondary;
		}

		if(is_array($bind))
		{
			foreach ($bind as $key => $value) {
				$cond .= " AND ".$key." = :".$key;
				$bindF[":".$key] = $value;
			}
		}

		if($obj)
		{
			$cols = $primary.".*";
			if($inverse)
			{
				$cols = $secondary.".*";
			}
		}

		$results = $this->dao->searchDependencies($tables, $cond, $bindF, $cols, $order);

		if($obj)
		{
			$mainclass = $inverse ? $secondary : $primary;
			return $this->createMultipleObjects($mainclass, $results);
		}
		else
		{
			return $results;
		}
	}

	private function createUniqueObject($entity, $data)
	{
		$o = new $entity($data->id);
		$o->fillData($data);
		return $o;
	}

	private function createMultipleObjects($entity, $data)
	{
		$o = array();
		foreach ($data as $item) 
		{
			$o[] = $this->createUniqueObject($entity, $item);
		}
		return $o;
	}
}
?>